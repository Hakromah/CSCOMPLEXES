/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Edit3, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';

// Helper for live letter grade feedback
const calculateLetterGrade = (marks: number | string): string => {
   const score = typeof marks === 'string' ? parseFloat(marks) : marks;
   if (isNaN(score)) return '-';
   if (score >= 90) return 'AA';
   if (score >= 85) return 'BA';
   if (score >= 80) return 'BB';
   if (score >= 75) return 'CB';
   if (score >= 70) return 'CC';
   if (score >= 60) return 'DC';
   if (score >= 50) return 'DD';
   return 'FF';
};

export default function BulkGradebookPage() {
   const [classes, setClasses] = useState<any[]>([]);
   const [exams, setExams] = useState<any[]>([]);
   const [selectedClassId, setSelectedClassId] = useState<string>('');
   const [isEditMode, setIsEditMode] = useState(false);

   // local state for uncommitted changes
   const [pendingChanges, setPendingChanges] = useState<any>({});
   const [reportData, setReportData] = useState<any[]>([]);

   // 1. Initial Load: Get Teacher's Classes
   useEffect(() => {
      api.get('/teacher/classes').then((res) => setClasses(res.data));
   }, []);

   // 2. Fetch Grades and Exams for the selected class
   const fetchData = async () => {
      if (!selectedClassId) return;
      try {
         const [resultsRes, examsRes] = await Promise.all([
            api.get(`/teacher/classes/${selectedClassId}/gradebook`),
            api.get('/teacher/exams'),
         ]);

         // Filter exams belonging only to the selected class
         const classExams = examsRes.data.filter(
            (e: any) => String(e.classe.id) === selectedClassId
         );
         setExams(classExams);

         // Map results to student rows
         const studentMap: any = {};
         resultsRes.data.forEach((r: any) => {
            const sId = r.student.userId;
            if (!studentMap[sId]) {
               studentMap[sId] = {
                  id: r.student.id,
                  name: r.student.name,
                  userId: sId,
                  marks: {}
               };
            }
            studentMap[sId].marks[r.exam.id] = { val: r.marks, resultId: r.id };
         });
         setReportData(Object.values(studentMap));
      } catch (error) {
         toast.error('Failed to load gradebook data');
         console.log(error)
      }
   };

   useEffect(() => {
      const loadData = async () => {
         await fetchData();
      };

      loadData();
   }, []);

   // 3. Handle live input changes with validation
   const handleMarkChange = (studentId: number, examId: number, value: string) => {
      const numValue = parseFloat(value);

      // Prevent invalid numbers reaching state
      if (value !== "" && (numValue < 0 || numValue > 100)) {
         toast.error("Marks must be between 0 and 100", { duration: 1500 });
         return;
      }

      setPendingChanges((prev: any) => ({
         ...prev,
         [`${studentId}-${examId}`]: value,
      }));
   };

   // 4. Save bulk changes to backend
   const saveBulk = async () => {
      const payload = Object.entries(pendingChanges).map(([key, val]) => {
         const [studentId, examId] = key.split('-');
         return {
            student: { id: parseInt(studentId) },
            exam: { id: parseInt(examId) },
            marks: parseFloat(val as string),
         };
      });

      if (payload.length === 0) {
         setIsEditMode(false);
         return;
      }

      const tid = toast.loading("Saving bulk updates to server...");
      try {
         await api.post('/teacher/results/bulk', payload);
         toast.success("Success! Gradebook updated.", { id: tid });
         setPendingChanges({});
         setIsEditMode(false);
         fetchData(); // Refresh table to show saved data
      } catch (e) {
         toast.error("Error: Could not save bulk results", { id: tid });
         console.log(e);
      }
   };

   return (
      <div className="p-[clamp(1.3rem,1vw+0.5rem,2rem)] space-y-[clamp(1.3rem,1vw+0.5rem,2rem)]">
         {/* HEADER SECTION */}
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-[clamp(1.3rem,1vw+0.5rem,2rem)] font-bold tracking-tight">Bulk Marks Entry</h1>
               <p className="text-muted-foreground">Quickly enter grades for the entire class.</p>
            </div>

            <div className="flex gap-3">
               {selectedClassId && (
                  <>
                     {!isEditMode ? (
                        <Button onClick={() => setIsEditMode(true)} className="gap-2">
                           <Edit3 className="w-4 h-4" /> Edit Mode
                        </Button>
                     ) : (
                        <>
                           <Button variant="ghost" onClick={() => { setIsEditMode(false); setPendingChanges({}); }}>
                              <X className="w-4 h-4" /> Cancel
                           </Button>
                           <Button onClick={saveBulk} className="gap-2 bg-green-600 hover:bg-green-700">
                              <Save className="w-4 h-4" /> Save All
                           </Button>
                        </>
                     )}
                  </>
               )}

               <Select onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[220px] border-border hover:border-primary transition-colors duration-300">
                     <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent className="border-border hover:border-primary transition-colors duration-300">
                     {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         {/* TABLE SECTION */}
         <Card>
            <CardContent className="pt-6">
               <div className="rounded-md border overflow-x-auto">
                  <Table>
                     <TableHeader className="bg-muted/50 py-3">
                        <TableRow>
                           <TableHead className="w-[200px]">Student Details</TableHead>
                           {exams.map((e) => (
                              <TableHead key={e.id} className="text-center min-w-[120px]">
                                 {e.name}
                              </TableHead>
                           ))}
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {reportData.length > 0 ? reportData.map((student) => (
                           <TableRow key={student.id}>
                              <TableCell>
                                 <div className="font-medium">{student.name}</div>
                                 <div className="text-[10px] font-mono text-muted-foreground uppercase">ID: {student?.userId || 'N/A'}</div>
                              </TableCell>

                              {exams.map((exam) => {
                                 const currentVal = student.marks[exam.id]?.val ?? '';
                                 const pendingVal = pendingChanges[`${student.id}-${exam.id}`];

                                 // Live logic: use typing value or saved value
                                 const activeVal = pendingVal !== undefined ? pendingVal : currentVal;
                                 const letterGrade = calculateLetterGrade(activeVal);

                                 return (
                                    <TableCell key={exam.id} className="text-center">
                                       {isEditMode ? (
                                          <div className="flex flex-col items-center gap-1">
                                             <Input
                                                type="number"
                                                className="h-9 w-20 text-center text-sm"
                                                defaultValue={currentVal}
                                                onChange={(e) => handleMarkChange(student.id, exam.id, e.target.value)}
                                             />
                                             <span className={`text-[10px] font-bold ${letterGrade === 'FF' ? 'text-red-500' : 'text-green-600'}`}>
                                                {letterGrade}
                                             </span>
                                          </div>
                                       ) : (
                                          <div className="flex flex-col items-center">
                                             <span className={`text-sm ${activeVal < 50 ? 'text-red-500 font-bold' : ''}`}>
                                                {activeVal || '-'}
                                             </span>
                                             <span className="text-[9px] text-muted-foreground font-bold">
                                                {letterGrade !== '-' ? letterGrade : ''}
                                             </span>
                                          </div>
                                       )}
                                    </TableCell>
                                 );
                              })}
                           </TableRow>
                        )) : (
                           <TableRow>
                              <TableCell colSpan={exams.length + 1} className="h-32 text-center text-muted-foreground">
                                 Please select a class to begin entering marks.
                              </TableCell>
                           </TableRow>
                        )}
                     </TableBody>
                  </Table>
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
