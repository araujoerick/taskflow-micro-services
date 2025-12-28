import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskComments, useAddComment } from '@/hooks/queries/useTasks';
import { commentSchema, type CommentInput } from '@/schemas/task.schema';
import { formatRelativeTime } from '@/utils/date-formatters';
import { authService, type UserBasicInfo } from '@/api/services/auth.service';
import { toast } from 'sonner';

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { data: comments, isLoading } = useTaskComments(taskId);
  const addComment = useAddComment();

  // Get unique user IDs from comments
  const userIds = useMemo(() => {
    if (!comments) return [];
    return [...new Set(comments.map((c) => c.userId))];
  }, [comments]);

  const { data: users } = useQuery({
    queryKey: ['users', userIds],
    queryFn: () => authService.getUsersByIds(userIds),
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, UserBasicInfo>();
    users?.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const getUserName = (userId: string): string => {
    const user = usersMap.get(userId);
    return user?.name || 'Unknown User';
  };

  const getUserInitials = (userId: string): string => {
    const user = usersMap.get(userId);
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return userId.slice(0, 2).toUpperCase();
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: CommentInput) => {
    try {
      await addComment.mutateAsync({ taskId, content: data.content });
      reset();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
        </h3>
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments?.length || 0})
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <div className="flex-1">
          <Textarea
            placeholder="Add a comment..."
            rows={2}
            {...register('content')}
            aria-invalid={!!errors.content}
          />
          {errors.content && (
            <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
          )}
        </div>
        <Button type="submit" size="icon" disabled={addComment.isPending}>
          {addComment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {getUserInitials(comment.userId)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{getUserName(comment.userId)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}
