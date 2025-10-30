import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search } from 'lucide-react'
import api from '@/lib/api'

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
})

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse {
  tasks: Task[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [page, statusFilter, priorityFilter, search])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      const { data } = await api.get<PaginatedResponse>(`/tasks?${params}`)
      setTasks(data?.tasks || [])
      setTotalPages(data?.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'success',
    } as const

    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
    }

    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const getPriorityBadge = (priority: Task['priority']) => {
    const variants = {
      low: 'secondary',
      medium: 'warning',
      high: 'destructive',
    } as const

    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    }

    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tasks</h1>
              <p className="text-[var(--color-muted-foreground)]">
                Manage and track your tasks
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter tasks by status, priority or search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <Input
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Select>

                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                    setPage(1)
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-[var(--color-muted-foreground)]">Loading tasks...</p>
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-[var(--color-muted-foreground)]">
                  No tasks found. Create your first task to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle>{task.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {task.description}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
