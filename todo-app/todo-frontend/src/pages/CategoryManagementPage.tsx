import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CategoryManager } from '@/components/categories/CategoryManager'

export function CategoryManagementPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6" data-testid="category-management-page">
      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>
      <h1 className="text-2xl font-semibold">Manage Categories</h1>
      <CategoryManager />
    </div>
  )
}
