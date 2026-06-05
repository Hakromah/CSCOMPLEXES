'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

interface DeleteClassAlertProps {
  classId: number;
  onFinished: () => void;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteClassAlert({
  classId,
  onFinished,
  onOpenChange,
}: DeleteClassAlertProps) {
  const handleDelete = async () => {
    try {
      await api.delete(`/admin/classes/${classId}`);
      toast.success('Class deleted successfully');
      onFinished();
    } catch (error) {
      toast.error('Failed to delete class');
      console.log(error);
    }
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the class.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
