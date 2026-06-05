'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Class name is required' }),
  grade: z.string().min(1, { message: 'Grade is required' }),
});

interface Classe {
  id: number;
  name: string;
  grade: string;
}

interface EditClassFormProps {
  classe: Classe;
  onFinished: () => void;
}

export default function EditClassForm({ classe, onFinished }: EditClassFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: classe.name,
      grade: classe.grade,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await api.put(`/admin/classes/${classe.id}`, values);
      toast.success('Class updated successfully');
      onFinished();
    } catch (error) {
      toast.error('Failed to update class');
      console.log(error)
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
