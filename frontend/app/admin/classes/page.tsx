/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useRef, startTransition } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Landmark,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Users2,
  Shapes,
  Loader2,
  ChevronRight
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
  FormControl, FormField, FormItem,
  FormLabel, FormMessage
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import DeleteClassAlert from '@/components/forms/DeleteClassAlert';
import EditClassForm from '@/components/forms/EditClassForm';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Class name is required' }),
  grade: z.string().min(1, { message: 'Grade is required' }),
});

interface Classe {
  id: number;
  name: string;
  grade: string;
}

export default function AdvancedClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Classe | null>(null);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', grade: '' },
  });

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/admin/classes');
      if (!isMounted.current) return;
      startTransition(() => {
        setClasses(response.data);
        setLoading(false);
      });
    } catch (error) {
      if (!isMounted.current) return;
      toast.error('Failed to sync institutional records');
      console.error('fetchClasses error:', error);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchClasses();
    return () => { isMounted.current = false; };
  }, [fetchClasses]);

  const handleCreateSubmit = async (values: z.infer<typeof formSchema>) => {
    const tid = toast.loading('Establishing new class unit...');
    try {
      await api.post('/admin/classes', values);
      toast.success('Class successfully registered', { id: tid });
      await fetchClasses();
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Registration failed', { id: tid });
      console.error('handleCreateSubmit error:', error);
    }
  };

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Registry...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)]">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Shapes size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Structure Management</span>
          </div>
          <h1 className="text-[clamp(1.2rem,2vw+1rem,2rem)] font-black text-slate-900 tracking-tighter sm:text-[clamp(1rem,3.5vw,4rem)] italic uppercase">
            Class <span className="text-primary">Units.</span>
          </h1>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-slate-900 md:hover:bg-primary text-white rounded-3xl h-14 px-8 font-black transition-all shadow-xl"
        >
          <Plus size={20} className="mr-2" /> CREATE CLASS
        </Button>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="relative group max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          <Input
            placeholder="Search classes by name or grade level..."
            className="h-16 pl-16 pr-8 rounded-4xl boder-[1px] border-primary/0 lg:hover:border-primary duration-500  shadow-sm bg-white font-bold text-slate-600 focus-visible:ring-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredClasses.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group h-full"
              >
                {/* ACTIONS PORTAL - Positioned outside the overflow-hidden container if necessary */}
                <div className="absolute top-6 right-6 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full bg-slate-50/50 md:hover:bg-white shadow-sm border border-slate-100">
                        <MoreVertical size={18} className="text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-slate-100 min-w-40 z-100">
                      <DropdownMenuItem
                        onSelect={() => { setSelectedClass(c); setIsEditDialogOpen(true); }}
                        className="rounded-xl font-bold text-[10px] uppercase tracking-widest p-3 cursor-pointer"
                      >
                        <Pencil size={14} className="mr-2 text-amber-500" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => { setSelectedClass(c); setIsDeleteDialogOpen(true); }}
                        className="rounded-xl font-bold text-[10px] uppercase tracking-widest p-3 text-rose-600 focus:bg-rose-50 focus:text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={14} className="mr-2" /> Dissolve Unit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 md:hover:border-primary duration-500 hover:shadow-2xl hover:-translate-y-2 transition-all h-full flex flex-col justify-between relative">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white mb-8">
                      <Landmark size={24} />
                    </div>

                    <div className="space-y-1">
                      <Badge className="bg-blue-50 text-primary hover:bg-blue-50 border-none rounded-lg font-black text-[9px] px-3 mb-2 tracking-[0.2em]">
                        GRADE {c.grade}
                      </Badge>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase group-hover:text-primary transition-colors pr-8">
                        {c.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Enrollment</span>
                      <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                        <Users2 size={14} /> <span className="text-xs italic font-black">ACTIVE</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </main>
      {/* DIALOGS */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="rounded-[3rem] p-10 border-none shadow-2xl sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter">
              New <span className="text-primary">Unit.</span>
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(handleCreateSubmit)(); }} className="space-y-6 mt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 10-A Science" {...field} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700" />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grade Level</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 10" {...field} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700" />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl uppercase text-[11px] tracking-[0.2em]">
                Initialize Class
              </Button>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {selectedClass && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="rounded-[clamp(1rem,3.5vw,3rem)] p-10 border-none shadow-2xl sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black italic tracking-tighter">
                Refine <span className="text-primary">Unit.</span>
              </DialogTitle>
            </DialogHeader>
            <EditClassForm
              classe={selectedClass}
              onFinished={async () => {
                setIsEditDialogOpen(false);
                await fetchClasses();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedClass && isDeleteDialogOpen && (
        <DeleteClassAlert
          classId={selectedClass.id}
          onFinished={async () => {
            setIsDeleteDialogOpen(false);
            await fetchClasses();
          }}
          onOpenChange={setIsDeleteDialogOpen}
        />
      )}
    </div>
  );
}
