/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  BookOpen, Plus, Search, MoreVertical, Pencil,
  Trash2, Library, GraduationCap, Box,
  Loader2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Subject name is required' }),
});

interface Subject {
  id: number;
  name: string;
}

export default function AdvancedSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/admin/subjects');
      setSubjects(response.data);
    } catch (error) {
      toast.error('Failed to sync curriculum data');
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isEditing = !!editingSubject;
    const tid = toast.loading(isEditing ? 'Refining subject...' : 'Cataloging new subject...');

    try {
      if (isEditing) {
        await api.put(`/admin/subjects/${editingSubject.id}`, values);
        toast.success('Subject details updated', { id: tid });
      } else {
        await api.post('/admin/subjects', values);
        toast.success('Subject added to registry', { id: tid });
      }
      fetchSubjects();
      setIsDialogOpen(false);
      setEditingSubject(null);
      form.reset();
    } catch (error) {
      toast.error('Operation failed', { id: tid });
      console.log(error)
    }
  };

  const openDialog = (subject: Subject | null = null) => {
    setEditingSubject(subject);
    form.reset({ name: subject?.name || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will remove the subject from all academic records.")) return;
    const tid = toast.loading('Removing from catalog...');
    try {
      await api.delete(`/admin/subjects/${id}`);
      toast.success('Subject removed', { id: tid });
      fetchSubjects();
    } catch (error) {
      toast.error('Action denied. Subject may be in use.', { id: tid });
      console.log(error)
    }
  };

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Catalog...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)]">
      <div className="max-w-7xl mx-auto space-y-[clamp(1rem,2vw+1rem,2rem)]">

        {/* Advanced Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Library size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Curriculum Master</span>
            </div>
            <h1 className="text-[clamp(1.2rem,2vw+1rem,2rem)] font-black text-slate-900 tracking-tighter sm:text-6xl italic">
              Academic <span className="text-primary">Catalog.</span>
            </h1>
          </div>
          <Button
            onClick={() => openDialog()}
            className="bg-slate-900 hover:bg-blue-600 text-white rounded-3xl h-14 px-8 font-black transition-all shadow-xl shadow-slate-200"
          >
            <Plus size={20} className="mr-2" /> CREATE SUBJECT
          </Button>
        </div>

        {/* Dynamic Search Bar */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          <Input
            placeholder="Search catalog by subject name..."
            className="h-16 pl-16 pr-8 rounded-4xl border border-primary/0 lg:hover:border-primary duration-500  shadow-sm bg-white font-bold text-slate-600 focus-visible:ring-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Subjects Grid */}
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredSubjects.map((subject) => (
              <motion.div
                key={subject.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 md:hover:border-primary duration-500 hover:shadow-2xl hover:-translate-y-2 transition-all h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                      <BookOpen size={28} />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                          <MoreVertical size={18} className="text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-slate-100 min-w-[140px]">
                        <DropdownMenuItem onClick={() => openDialog(subject)} className="rounded-xl font-bold text-[10px] uppercase tracking-widest p-3 cursor-pointer">
                          <Pencil size={14} className="mr-2 text-amber-500" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(subject.id)} className="rounded-xl font-bold text-[10px] uppercase tracking-widest p-3 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600">
                          <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-4">
                    <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none rounded-lg font-black text-[9px] px-3 py-1">
                      ID: #{subject.id}
                    </Badge>
                    <h3 className="lg:text-[clamp(1rem,2vw+1rem,1.2rem)] text-lg font-black text-slate-900 tracking-tighter leading-none italic uppercase group-hover:text-primary transition-colors">
                      {subject.name}
                    </h3>
                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <GraduationCap size={12} /> Standard
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        <Sparkles size={12} /> Unified
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredSubjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100"
          >
            <Box size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-sm tracking-tight italic">No subjects found in the current registry.</p>
          </motion.div>
        )}
      </div>

      {/* Modernized Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[3rem] p-10 border-none shadow-2xl sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter text-slate-900">
              {editingSubject ? 'Edit' : 'Create'} <span className="text-primary">Subject.</span>
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
              Configuration for curriculum identification.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Quantum Physics"
                        {...field}
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 placeholder:text-slate-300 focus-visible:ring-blue-600"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 uppercase text-[11px] tracking-[0.2em]">
                {editingSubject ? 'Commit Changes' : 'Save to Registry'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
