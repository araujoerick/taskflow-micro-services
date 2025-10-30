import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageSquare, Clock, Edit, Trash2 } from 'lucide-react'
import api from '@/lib/api'

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetailsPage,
})

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  userId: string
}

interface Comment {
  id: string
  content: string
  userId: string
  userName: string
  createdAt: string
}

interface HistoryEntry {
  id: string
  field: string
  oldValue: string
  newValue: string
  changedAt: string
  changedBy: string
}

function TaskDetailsPage() {
  const { taskId } = Route.useParams()
  const navigate = useNavigate()

  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const [newComment, setNewComment] = useState('')
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})

  useEffect(() => {
    fetchTaskDetails()
  }, [taskId])

  const fetchTaskDetails = async () => {
    try {
      setLoading(true)
      const [taskRes, commentsRes, historyRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/comments`),
        api.get(`/tasks/${taskId}/history`),
      ])

      setTask(taskRes.data)
      setEditedTask(taskRes.data)
      setComments(commentsRes.data)
      setHistory(historyRes.data)
    } catch (error) {
      console.error('Failed to fetch task details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTask = async () => {
    try {
      await api.put(`/tasks/${taskId}`, editedTask)
      await fetchTaskDetails()
      setEditMode(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await api.delete(`/tasks/${taskId}`)
      navigate({ to: '/tasks' })
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await api.post(`/tasks/${taskId}/comments`, { content: newComment })
      setNewComment('')
      await fetchTaskDetails()
    } catch (error) {
      console.error('Failed to add comment:', error)
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-[var(--color-muted-foreground)]">Loading task...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <Layout>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[var(--color-muted-foreground)]">Task not found</p>
            </CardContent>
          </Card>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/tasks' })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Task Details</h1>
              <p className="text-[var(--color-muted-foreground)]">
                View and manage task information
              </p>
            </div>
            {!editMode && (
              <div className="flex gap-2">
                <Button onClick={() => setEditMode(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDeleteTask}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  {editMode ? (
                    <Input
                      value={editedTask.title}
                      onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                      placeholder="Task title"
                      className="text-2xl font-bold"
                    />
                  ) : (
                    <CardTitle>{task.title}</CardTitle>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {getStatusBadge(editMode ? editedTask.status! : task.status)}
                  {getPriorityBadge(editMode ? editedTask.priority! : task.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editedTask.description}
                      onChange={(e) =>
                        setEditedTask({ ...editedTask, description: e.target.value })
                      }
                      placeholder="Task description"
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={editedTask.status}
                        onChange={(e) =>
                          setEditedTask({ ...editedTask, status: e.target.value as Task['status'] })
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={editedTask.priority}
                        onChange={(e) =>
                          setEditedTask({
                            ...editedTask,
                            priority: e.target.value as Task['priority'],
                          })
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleUpdateTask}>Save Changes</Button>
                    <Button variant="outline" onClick={() => {
                      setEditMode(false)
                      setEditedTask(task)
                    }}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[var(--color-muted-foreground)]">{task.description}</p>
                  <div className="flex gap-4 text-sm text-[var(--color-muted-foreground)]">
                    <span>Created: {formatDate(task.createdAt)}</span>
                    <span>Updated: {formatDate(task.updatedAt)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  <Button type="submit" size="sm">Add Comment</Button>
                </form>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border rounded-md p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{comment.userName}</span>
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  History ({history.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
                      No history yet
                    </p>
                  ) : (
                    history.map((entry) => (
                      <div key={entry.id} className="border-l-2 border-[var(--color-border)] pl-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{entry.field}</span>
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            {formatDate(entry.changedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-muted-foreground)]">
                          Changed from <span className="font-medium">{entry.oldValue}</span> to{' '}
                          <span className="font-medium">{entry.newValue}</span>
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          by {entry.changedBy}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
