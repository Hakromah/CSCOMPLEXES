/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  classId: z.string().min(1, { message: 'La classe est requise' }),
  studentId: z.string().min(1, { message: 'L\'élève est requis' }),
  examId: z.string().min(1, { message: 'L\'examen est requis' }),
  marks: z.string()
    .refine((val) => !isNaN(Number(val)), { message: 'La note doit être un nombre' })
    .refine((val) => Number(val) <= 100 && Number(val) >= 0, { message: 'La note doit être comprise entre 0 et 100' }),
  grade: z.string().optional(),
  remarks: z.string().optional(),
});

interface ResultFormProps {
  result?: any;
  existingResults: any[]; // Data passed from parent to prevent duplicates
  onFinished: () => void;
}

export default function ResultForm({ result, existingResults, onFinished }: ResultFormProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: result?.exam?.classe?.id ? String(result.exam.classe.id) : '',
      studentId: result?.student?.id ? String(result.student.id) : '',
      examId: result?.exam?.id ? String(result.exam.id) : '',
      marks: result?.marks ? String(result.marks) : '',
      grade: result?.grade || undefined,
      remarks: result?.remarks || '',
    },
  });

  // Watch fields for dynamic filtering
  const watchExamId = form.watch('examId');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, examsRes] = await Promise.all([
          api.get('/teacher/classes'),
          api.get('/teacher/exams'),
        ]);
        setClasses(classesRes.data);
        setExams(examsRes.data);

        if (result?.exam?.classe?.id) {
          const studentRes = await api.get(`/teacher/classes/${result.exam.classe.id}/students`);
          setStudents(studentRes.data);
        }
      } catch (error) {
        toast.error('Failed to load form data');
        console.log(error);
      }
    };
    fetchInitialData();
  }, [result]);

  const handleClassChange = async (classId: string) => {
    form.setValue('classId', classId);
    form.setValue('studentId', ''); // Reset student selection
    try {
      const response = await api.get(`/teacher/classes/${classId}/students`);
      setStudents(response.data);
    } catch (error) {
      setStudents([]);
      toast.error('No students found for this class');
      console.log(error);
    }
  };

  // --- DUPLICATE PREVENTION LOGIC ---
  const filteredStudents = useMemo(() => {
    // If we are editing, we must show the current student
    if (result) return students;
    if (!watchExamId) return students;

    // Find IDs of students who already have a result for the selected exam
    const gradedStudentIds = existingResults
      .filter((r: any) => r?.exam?.id && String(r.exam.id) === watchExamId)
      .map((r: any) => r?.student?.id ? String(r.student.id) : '');

    return students.filter((s: any) => !gradedStudentIds.includes(String(s.id)));
  }, [students, watchExamId, existingResults, result]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const payload = {
        exam: { id: parseInt(values.examId) },
        student: { id: parseInt(values.studentId) },
        marks: parseFloat(values.marks),
        grade: values.grade || null,
        remarks: values.remarks || '',
      };

      if (result) {
        await api.put(`/teacher/results/${result.id}`, payload);
        toast.success('Enregistrement mis à jour avec succès');
      } else {
        await api.post('/teacher/results', payload);
        toast.success('Enregistrement enregistré avec succès');
      }
      onFinished();
    } catch (error: any) {
      // Backend error message for duplicate (from our saveResult update)
      const errorMsg = error.response?.data?.message || 'Erreur d\'enregistrement';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* CLASS SELECT */}
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={handleClassChange} defaultValue={field.value} disabled={!!result}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger></FormControl>
                <SelectContent>
                  {classes.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* EXAM SELECT */}
        <FormField
          control={form.control}
          name="examId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Période d'évaluation</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!result}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'examen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {exams
                    .filter(e => !form.watch('classId') || (e?.classe?.id && String(e.classe.id) === form.watch('classId')))
                    .map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        <div className="flex flex-col">
                          <span className="font-medium">{e.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">
                            {e.term} — {e.weight}% Poids
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* NEW: Info badge that appears when an exam is selected */}
              {form.watch('examId') && !result && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md animate-in fade-in slide-in-from-top-1 duration-200">
                  {(() => {
                    const selected = exams.find(ex => String(ex.id) === form.watch('examId'));
                    return selected ? (
                      <div className="text-[11px] text-blue-700 font-medium flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                          {selected.term}
                        </span>
                        <span>
                          Cet enregistrement représente <strong>{selected.weight}%</strong> de la note du semestre.
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* STUDENT SELECT - FILTERED */}
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'étudiant</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!result || !watchExamId}>
                <FormControl><SelectTrigger><SelectValue placeholder={watchExamId ? "Sélectionner l'étudiant" : "Sélectionner l'examen d'abord"} /></SelectTrigger></FormControl>
                <SelectContent>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.username || s.name}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-center text-muted-foreground">Tous les étudiants de cette classe ont déjà une note pour cet examen.</div>
                  )}
                </SelectContent>
              </Select>
              {filteredStudents.length === 0 && watchExamId && !result && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Aucun étudiant sans note n'est disponible.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points (%)</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FF'].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commentaires de l'enseignant</FormLabel>
              <FormControl><Input placeholder="Fournir des commentaires ou des notes" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {result ? 'Modifier l\'enregistrement' : 'Enregistrer comme brouillon'}
        </Button>
      </form>
    </Form>
  );
}

