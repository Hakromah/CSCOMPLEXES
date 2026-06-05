/* eslint-disable @typescript-eslint/no-explicit-any */
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

interface DeleteExamAlertProps {
   examId: number;
   examName: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onFinished: () => void;
}

export default function DeleteExamAlert({
   examId,
   examName,
   open,
   onOpenChange,
   onFinished,
}: DeleteExamAlertProps) {
   const handleDelete = async () => {
      try {
         await api.delete(`/teacher/exams/${examId}`);
         toast.success('Exam deleted successfully');
         onOpenChange(false);
         onFinished();
      } catch (error: any) {
         // Handle the case where a co-teacher tries to delete an exam they didn't create
         if (error.response?.status === 403) {
            toast.error('Access Denied', {
               description: 'You can only delete exams that you created.',
            });
         } else {
            toast.error('Failed to delete exam');
         }
      }
   };

   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
               <AlertDialogDescription>
                  This will permanently delete the exam <strong>{examName}</strong> and all associated results.
                  This action cannot be undone.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               >
                  Delete
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
