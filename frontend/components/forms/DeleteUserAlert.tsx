/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
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
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteUserAlertProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: () => Promise<void>;
}

export default function DeleteUserAlert({
  userId,
  open,
  onOpenChange,
  onFinished,
}: DeleteUserAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    // Prevent the dialog from closing immediately if we want to handle the state
    e.preventDefault();
    setIsDeleting(true);

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('Identité purgée du registre');

      // Close dialog first
      onOpenChange(false);

      // Execute parent refresh (awaited because of the Promise<void> requirement)
      await onFinished();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Erreur d\'intégrité : L\'utilisateur est toujours lié à des classes actives.');
      } else {
        toast.error('La purge du registre a échoué. Lien système actif.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
        <AlertDialogHeader>
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <Trash2 className="text-rose-600" size={24} />
          </div>
          <AlertDialogTitle className="text-xl font-black tracking-tight">
            Confirmation de Suppression
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 font-medium">
            Cette action supprimera définitivement cette identité du registre AMF.
            Les données historiques comme les notes peuvent être archivées, mais le compte sera inaccessible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel className="rounded-xl border-slate-200 font-bold">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-rose-100"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Confirmation de Suppression'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

