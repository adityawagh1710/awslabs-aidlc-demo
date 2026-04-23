import { Prisma, type Priority, type Task, type TaskStatus } from '@prisma/client'
import { prisma } from './prisma-client'

export interface TaskWithCategories extends Task {
  categories: Array<{
    category: { id: string; name: string; createdAt: Date; updatedAt: Date }
  }>
}

export interface TaskSortInput {
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface TaskFilters {
  search?: string
  status?: 'active' | 'completed' | 'all'
  priority?: Array<'Low' | 'Medium' | 'High'>
  categoryIds?: string[]
  dueDateFrom?: Date
  dueDateTo?: Date
}

export interface PaginationInput {
  page: number
  pageSize: number
}

export interface CreateTaskData {
  userId: string
  title: string
  description?: string | null
  priority: Priority
  dueDate?: Date | null
  status?: TaskStatus
}

export interface UpdateTaskData {
  title?: string
  description?: string | null
  priority?: Priority
  dueDate?: Date | null
  status?: TaskStatus
  completedAt?: Date | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PRIORITY_MAP: Record<string, Priority> = { Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH' }

function buildOrderBy(sort: TaskSortInput): object[] {
  if (!sort.sortBy) {
    return [
      { status: 'asc' },
      { dueDate: { sort: 'asc', nulls: 'last' } },
    ]
  }
  const dir = sort.sortOrder ?? 'asc'
  switch (sort.sortBy) {
    case 'dueDate':
      return [{ dueDate: { sort: dir, nulls: 'last' } }, { id: 'asc' }]
    case 'priority':
      return [{ priority: dir }, { id: 'asc' }]
    case 'createdAt':
      return [{ createdAt: dir }, { id: 'asc' }]
    case 'title':
      return [{ title: dir }, { id: 'asc' }]
    default:
      return [{ createdAt: 'desc' }]
  }
}

function buildPrismaWhere(userId: string, filters: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { userId }

  if (filters.status === 'active') where.status = 'ACTIVE'
  else if (filters.status === 'completed') where.status = 'COMPLETED'

  if (filters.priority?.length) {
    where.priority = { in: filters.priority.map((p) => PRIORITY_MAP[p] as Priority) }
  }

  if (filters.categoryIds?.length) {
    where.categories = { some: { categoryId: { in: filters.categoryIds } } }
  }

  if (filters.dueDateFrom || filters.dueDateTo) {
    where.dueDate = {}
    if (filters.dueDateFrom) (where.dueDate as Prisma.DateTimeNullableFilter).gte = filters.dueDateFrom
    if (filters.dueDateTo) (where.dueDate as Prisma.DateTimeNullableFilter).lt = filters.dueDateTo
  }

  return where
}

// Raw row type returned by $queryRaw FTS queries
interface RawTaskRow {
  id: string
  userId: string
  title: string
  description: string | null
  status: 'ACTIVE' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  categories: Array<{ id: string; name: string; createdAt: Date; updatedAt: Date }> | null
}

function mapRawRow(row: RawTaskRow): TaskWithCategories {
  const cats = row.categories ?? []
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    // @ts-expect-error – searchVector is Unsupported type, not in Task type
    searchVector: undefined,
    categories: cats.map((c) => ({ category: c })),
  }
}

// Build additional SQL fragments for FTS path filters
function buildStatusSql(status?: TaskFilters['status']): Prisma.Sql {
  if (status === 'active') return Prisma.sql`AND t.status = 'ACTIVE'::"TaskStatus"`
  if (status === 'completed') return Prisma.sql`AND t.status = 'COMPLETED'::"TaskStatus"`
  return Prisma.empty
}

function buildPrioritySql(priorities?: Array<'Low' | 'Medium' | 'High'>): Prisma.Sql {
  if (!priorities?.length) return Prisma.empty
  const mapped = priorities.map((p) => PRIORITY_MAP[p])
  return Prisma.sql`AND t.priority = ANY(ARRAY[${Prisma.join(mapped.map((p) => Prisma.sql`${p}::"Priority"`))}])`
}

function buildCategoryIdsSql(categoryIds?: string[]): Prisma.Sql {
  if (!categoryIds?.length) return Prisma.empty
  return Prisma.sql`AND EXISTS (
    SELECT 1 FROM "TaskCategory" tc
    WHERE tc."taskId" = t.id
    AND tc."categoryId" = ANY(ARRAY[${Prisma.join(categoryIds.map((id) => Prisma.sql`${id}`))}])
  )`
}

function buildDateFromSql(from?: Date): Prisma.Sql {
  if (!from) return Prisma.empty
  return Prisma.sql`AND t."dueDate" >= ${from}`
}

function buildDateToSql(to?: Date): Prisma.Sql {
  if (!to) return Prisma.empty
  return Prisma.sql`AND t."dueDate" < ${to}`
}

function buildOrderBySql(sort: TaskSortInput): Prisma.Sql {
  const dir = sort.sortOrder === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`
  switch (sort.sortBy) {
    case 'dueDate':
      return Prisma.sql`t."dueDate" ${dir} NULLS LAST, t.id ASC`
    case 'priority':
      return Prisma.sql`t.priority ${dir}, t.id ASC`
    case 'createdAt':
      return Prisma.sql`t."createdAt" ${dir}, t.id ASC`
    case 'title':
      return Prisma.sql`t.title ${dir}, t.id ASC`
    default:
      return Prisma.sql`t.status ASC, t."dueDate" ASC NULLS LAST`
  }
}

// ── Repository ─────────────────────────────────────────────────────────────────

export class TaskRepository {
  async findAll(
    userId: string,
    filters: TaskFilters,
    pagination: PaginationInput,
    sort: TaskSortInput,
  ): Promise<{ tasks: TaskWithCategories[]; total: number }> {
    const { page, pageSize } = pagination
    const offset = (page - 1) * pageSize

    // Path B: FTS search present — use $queryRaw (Pattern 29)
    if (filters.search) {
      const tsQuery = filters.search

      const [rawTasks, countResult] = await Promise.all([
        prisma.$queryRaw<RawTaskRow[]>(Prisma.sql`
          SELECT
            t.id, t."userId", t.title, t.description, t.status, t.priority,
            t."dueDate", t."completedAt", t."createdAt", t."updatedAt",
            COALESCE(
              json_agg(
                json_build_object(
                  'id', c.id, 'name', c.name,
                  'createdAt', c."createdAt", 'updatedAt', c."updatedAt"
                ) ORDER BY c.name
              ) FILTER (WHERE c.id IS NOT NULL),
              '[]'
            ) AS categories
          FROM "Task" t
          LEFT JOIN "TaskCategory" tc ON tc."taskId" = t.id
          LEFT JOIN "Category" c ON c.id = tc."categoryId"
          WHERE t."userId" = ${userId}
            AND t.search_vector @@ plainto_tsquery('english', ${tsQuery})
            ${buildStatusSql(filters.status)}
            ${buildPrioritySql(filters.priority)}
            ${buildCategoryIdsSql(filters.categoryIds)}
            ${buildDateFromSql(filters.dueDateFrom)}
            ${buildDateToSql(filters.dueDateTo)}
          GROUP BY t.id
          ORDER BY ${buildOrderBySql(sort)}
          LIMIT ${pageSize} OFFSET ${offset}
        `),
        prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
          SELECT COUNT(*) as count
          FROM "Task" t
          WHERE t."userId" = ${userId}
            AND t.search_vector @@ plainto_tsquery('english', ${tsQuery})
            ${buildStatusSql(filters.status)}
            ${buildPrioritySql(filters.priority)}
            ${buildCategoryIdsSql(filters.categoryIds)}
            ${buildDateFromSql(filters.dueDateFrom)}
            ${buildDateToSql(filters.dueDateTo)}
        `),
      ])

      return {
        tasks: rawTasks.map(mapRawRow),
        total: Number(countResult[0]?.count ?? 0),
      }
    }

    // Path A: No search — use Prisma findMany for full type safety (Pattern 31)
    const where = buildPrismaWhere(userId, filters)
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: buildOrderBy(sort) as any,
        take: pageSize,
        skip: offset,
        include: {
          categories: {
            include: { category: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ])
    return { tasks: tasks as TaskWithCategories[], total }
  }

  async findById(id: string): Promise<TaskWithCategories | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
      },
    }) as Promise<TaskWithCategories | null>
  }

  async create(data: CreateTaskData): Promise<TaskWithCategories> {
    return prisma.task.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        dueDate: data.dueDate ?? null,
        status: data.status ?? 'ACTIVE',
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    }) as Promise<TaskWithCategories>
  }

  async update(id: string, data: UpdateTaskData): Promise<TaskWithCategories> {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        categories: {
          include: { category: true },
        },
      },
    }) as Promise<TaskWithCategories>
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } })
  }
}
