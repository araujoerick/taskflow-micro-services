import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Task } from '@repo/types';

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DeleteTaskDialog({
  open,
  onOpenChange,
  task,
  onConfirm,
  isLoading,
}: DeleteTaskDialogProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Task</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete <strong>"{task.title}"</strong>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
