-- Add STORED generated tsvector column for full-text search (PostgreSQL 12+)
-- Concatenates title and description; auto-updated on INSERT/UPDATE
ALTER TABLE "Task"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  ) STORED;

-- GIN index for fast FTS lookups
CREATE INDEX "tasks_search_vector_gin_idx" ON "Task" USING GIN ("search_vector");

-- Composite index covering combined priority+status filter queries
CREATE INDEX "Task_userId_priority_status_idx" ON "Task" ("userId", priority, status);
