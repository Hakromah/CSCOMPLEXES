/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react'; // For the button icon
import { toast } from 'sonner';
import api from '@/lib/api';

// PDF Libraries
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GradebookPage() {
   const [classes, setClasses] = useState<any[]>([]);
   const [selectedClassId, setSelectedClassId] = useState<string>('');
   const [reportData, setReportData] = useState<any[]>([]);
   const [exams, setExams] = useState<string[]>([]);

   useEffect(() => {
      api.get('/teacher/classes').then(res => setClasses(res.data));
   }, []);

   useEffect(() => {
      if (!selectedClassId) return;

      const fetchGrades = async () => {
         try {
            const res = await api.get(`/teacher/classes/${selectedClassId}/gradebook`);
            const results = res.data;

            const uniqueExams = Array.from(new Set(results.map((r: any) => r.exam.name))) as string[];
            setExams(uniqueExams);

            const studentMap: any = {};
            results.forEach((r: any) => {
               const sId = r.student.userId;
               if (!studentMap[sId]) {
                  studentMap[sId] = {
                     name: r.student.name,
                     userId: sId,
                     marks: {}
                  };
               }
               studentMap[sId].marks[r.exam.name] = r.marks;
            });

            setReportData(Object.values(studentMap));
         } catch (error) {
            toast.error('Failed to load gradebook');
            console.log(error);
         }
      };

      fetchGrades();
   }, [selectedClassId]);

   // --- PDF GENERATION LOGIC ---
   const downloadPDF = () => {
      if (reportData.length === 0) {
         toast.error('No data available to download');
         return;
      }

      try {
        const className = classes.find((c: any) => String(c.id) === selectedClassId)?.name || 'Class';
        const schoolName = 'A.M. FOFANA ISLAMIC & ENGLISH HIGH SCHOOL';
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;
        const pageW = doc.internal.pageSize.getWidth();
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Dark header bar
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(schoolName.toUpperCase(), 14, 11);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('Official Academic Grade Report  •  Results Management System', 14, 17);
        doc.text(`Generated: ${date}`, 14, 22);

        // Class badge (right side)
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(pageW - 60, 6, 46, 16, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`CLASS: ${className}`, pageW - 37, 16, { align: 'center' });

        // Section title
        doc.setTextColor(15, 23, 42);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('ACADEMIC PERFORMANCE MATRIX', 14, 38);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Total students: ${reportData.length}   |   Total assessments: ${exams.length}`, 14, 44);

        // Table header
        const head = [['#', 'Student Name', 'Student ID', ...exams.map((e: any) => `${e}\n`), 'Avg.', 'Grade']];

        // Table body
        const body = reportData.map((student: any, idx: number) => {
           const scores = exams.map((e: any) => student.marks[e] ?? null);
           const validScores = scores.filter((s: any) => s !== null) as number[];
           const avg = validScores.length > 0
              ? validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length
              : null;
           const letterGrade = (score: number) => {
              if (score >= 90) return 'AA'; if (score >= 85) return 'BA';
              if (score >= 80) return 'BB'; if (score >= 75) return 'CB';
              if (score >= 70) return 'CC'; if (score >= 60) return 'DC';
              if (score >= 50) return 'DD'; return 'FF';
           };
           return [
              String(idx + 1),
              student.name || student.username || 'Unknown',
              student.userId || 'N/A',
              ...scores.map((s: any) => (s !== null ? String(s) : '-')),
              avg !== null ? `${avg.toFixed(1)}%` : '-',
              avg !== null ? letterGrade(avg) : '-',
           ];
        });

        autoTable(doc, {
           startY: 48,
           head,
           body,
           theme: 'grid',
           headStyles: {
              fillColor: [15, 23, 42] as any,
              textColor: [255, 255, 255],
              fontSize: 7.5,
              fontStyle: 'bold',
              halign: 'center',
              valign: 'middle',
              cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
           },
           bodyStyles: {
              fontSize: 8,
              cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
              valign: 'middle',
           },
           alternateRowStyles: { fillColor: [248, 250, 252] as any },
           columnStyles: {
              0: { halign: 'center', cellWidth: 8 },
              1: { cellWidth: 38, fontStyle: 'bold' },
              2: { cellWidth: 28, fontSize: 7 },
              [exams.length + 3]: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: [37, 99, 235] as any },
              [exams.length + 4]: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
           },
           didParseCell: (data: any) => {
              if (data.section === 'body') {
                 const colIdx = data.column.index;
                 if (colIdx >= 3 && colIdx < exams.length + 3) {
                    const raw = parseFloat(data.cell.raw as string);
                    if (!isNaN(raw)) {
                       if (raw < 50) { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
                       else if (raw >= 80) { data.cell.styles.textColor = [5, 150, 105]; }
                       data.cell.styles.halign = 'center';
                    }
                 }
                 if (colIdx === exams.length + 4) {
                    const grade = data.cell.raw as string;
                    if (grade === 'FF' || grade === 'DD') data.cell.styles.textColor = [220, 38, 38];
                    else if (grade === 'AA' || grade === 'BA') data.cell.styles.textColor = [5, 150, 105];
                    data.cell.styles.halign = 'center';
                 }
              }
           },
        });

        // Footer
        const finalY = doc.lastAutoTable?.finalY ?? 180;
        const footerY = Math.max(finalY + 12, 185);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, footerY, pageW - 14, footerY);
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.setFont('Helvetica', 'normal');
        doc.text(
           `${schoolName}  |  Official Grade Report for ${className}  |  ${date}  |  Confidential`,
           pageW / 2, footerY + 5, { align: 'center' }
        );

        doc.save(`GradeReport_${className.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
        toast.success('Grade Report PDF exported successfully!');
      } catch (err) {
        console.error('PDF generation failed:', err);
        toast.error('Export failed. Please try again.');
      }
   };

   return (
      <div className="p-8 space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-[clamp(1.3rem,1vw+0.5rem,2rem)] font-bold tracking-tight">Gradebook</h1>
               <p className="text-muted-foreground">Monitor and export student performance.</p>
            </div>

            <div className="flex items-center gap-4">
               {reportData.length > 0 && (
                  <Button onClick={downloadPDF} variant="outline" className="flex gap-2">
                     <Download className="w-4 h-4" /> Download PDF
                  </Button>
               )}

               <Select onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[250px] border-border hover:border-primary transition-colors duration-300">
                     <SelectValue placeholder="Select a Class" />
                  </SelectTrigger>
                  <SelectContent className="border-border hover:border-primary transition-colors duration-300">
                     {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Student Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="rounded-md border overflow-x-auto">
                  <Table>
                     <TableHeader className="bg-muted/50">
                        <TableRow>
                           <TableHead className="w-[120px]">Student ID</TableHead>
                           <TableHead className="min-w-[180px]">Name</TableHead>
                           {exams.map(examName => (
                              <TableHead key={examName} className="text-center">{examName}</TableHead>
                           ))}
                           <TableHead className="text-right font-bold">Average</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {reportData.length > 0 ? reportData.map((student) => {
                           const scores = Object.values(student.marks) as number[];
                           const average = scores.length > 0
                              ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
                              : '-';

                           return (
                              <TableRow key={student.userId}>
                                 <TableCell className="font-mono text-xs">{student?.userId || 'N/A'}</TableCell>
                                 <TableCell className="font-medium">{student.username || student.name || 'unkown student'}</TableCell>
                                 {exams.map(examName => (
                                    <TableCell
                                       key={examName}
                                       className={`text-center ${student.marks[examName] < 50 ? 'text-red-500 font-bold' : ''}`}
                                    >
                                       {student.marks[examName] ?? '-'}
                                    </TableCell>
                                 ))}
                                 <TableCell className="text-right font-bold text-primary">
                                    {average === '-' ? '-' : `${average}%`}
                                 </TableCell>
                              </TableRow>
                           );
                        }) : (
                           <TableRow>
                              <TableCell colSpan={exams.length + 3} className="h-24 text-center text-muted-foreground">
                                 Select a class to view performance data.
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
