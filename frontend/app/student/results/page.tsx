/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Legend,
} from 'recharts';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Award, BookOpen, TrendingUp, CheckCircle2, AlertCircle, School, Filter } from 'lucide-react';
import api from '@/lib/api';

const calculateLetterGrade = (marks: number): string => {
   if (marks >= 90) return 'AA';
   if (marks >= 85) return 'BA';
   if (marks >= 80) return 'BB';
   if (marks >= 75) return 'CB';
   if (marks >= 70) return 'CC';
   if (marks >= 60) return 'DC';
   if (marks >= 50) return 'DD';
   return 'FF';
};

export default function StudentResultsPage() {
   const [results, setResults] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedSemester, setSelectedSemester] = useState<string>('all');

   useEffect(() => {
      const fetchResults = async () => {
         try {
            const response = await api.get('/student/results');
            setResults(response.data);
         } catch (error) {
            toast.error('Failed to load your academic records');
            console.error(error);
         } finally {
            setLoading(false);
         }
      };
      fetchResults();
   }, []);

   // --- FILTER LOGIC ---
   const uniqueSemesters = useMemo(() => {
      const sems = results.map(r => r.semester).filter(Boolean);
      return Array.from(new Set(sems));
   }, [results]);

   const filteredResults = useMemo(() => {
      if (selectedSemester === 'all') return results;
      return results.filter(r => r.semester === selectedSemester);
   }, [results, selectedSemester]);

   // Overview Statistics based on ALL results
   const totalScore = results.reduce((acc, curr) => acc + (curr.marks || 0), 0);
   const averageScore = results.length > 0 ? (totalScore / results.length).toFixed(1) : '0';
   const highestScore = results.length > 0 ? Math.max(...results.map(r => r.marks)) : 0;

   const chartData = results.map(r => ({
      name: r.examName || 'Exam',
      myScore: r.marks,
      classAvg: r.classAverage || 0,
   }));

   if (loading) {
      return (
         <div className="flex h-[80vh] items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
               <School className="w-8 h-8 text-primary animate-bounce" />
               <p className="text-muted-foreground font-medium">Loading Academic Profile...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="p-8 space-y-[clamp(1.3rem,2vw+1rem,2rem)] max-w-7xl mx-auto">
         {/* HEADER */}
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
            <div>
               <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter italic">Academic <span className="text-primary">Portal.</span></h1>
               <p className="text-muted-foreground">Welcome, {results[0]?.student?.name || 'Student'}. View your growth and performance.</p>
            </div>
            <div className="flex items-center flex-wrap gap-4">
               <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10 md:hover:border-primary duration-300">
                  <div className="text-right">
                     <p className="text-xs uppercase text-muted-foreground font-bold">Overall Average</p>
                     <p className="text-3xl font-black text-primary">{averageScore}%</p>
                  </div>
                  <Award className="w-8 h-8 text-primary" />
               </div>
            </div>
         </header>

         {/* FILTERS */}
         <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 min-w-max">
               <Filter className="w-4 h-4" />
               <span className="text-sm font-bold uppercase">Filter Results:</span>
            </div>
            <Select value={selectedSemester} onValueChange={(val) => setSelectedSemester(val)}>
               <SelectTrigger className="md:w-[200px] w-full bg-white border border-slate-200 md:hover:border-primary duration-500 transition-colors">
                  <SelectValue placeholder="All Semesters" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map(sem => <SelectItem key={sem} value={sem}>{sem}</SelectItem>)}
               </SelectContent>
            </Select>
         </div>

         {/* ANALYTICS GRID */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-slate-200/60 py-5">
               <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-blue-500" />
                     <CardTitle className="text-base font-semibold">Score Trends vs. Class Average</CardTitle>
                  </div>
               </CardHeader>
               <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Line name="My Score" type="monotone" dataKey="myScore" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
                        <Line name="Class Mean" type="monotone" dataKey="classAvg" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6 6" dot={false} />
                     </LineChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
               <Card className="bg-primary text-primary-foreground border py-2 border-transparent md:hover:border-blue-300 duration-500 transition-colors shadow-lg">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-primary-foreground/70 text-xs font-bold uppercase">Peak Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <h2 className="text-4xl font-black">{highestScore}%</h2>
                     <p className="text-sm mt-1 opacity-80 font-medium">Highest score achieved to date</p>
                  </CardContent>
               </Card>

               <Card className="flex-1 border md:hover:border-primary py-3 duration-500 transition-colors border-dashed">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Evaluations</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                     <BookOpen className="w-8 h-8 text-primary/40" />
                     <h2 className="text-3xl font-bold">{results.length} Exams</h2>
                  </CardContent>
               </Card>
            </div>
         </div>

         {/* DETAILED RESULTS TABLE — scrollable */}
         <Card className="shadow-sm border border-slate-200/60 md:hover:border-primary duration-500 transition-colors overflow-hidden">
            <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
               <Table>
                  <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e2e8f0]">
                     <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[250px] font-bold pl-6">Examination</TableHead>
                        <TableHead className="font-bold">Term &amp; Semester</TableHead>
                        <TableHead className="text-center font-bold">Score</TableHead>
                        <TableHead className="text-center font-bold">Grade</TableHead>
                        <TableHead className="text-right pr-6 font-bold">Outcome</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredResults.length > 0 ? filteredResults.map((r) => {
                        const isPassing = r.marks >= 50;
                        return (
                           <TableRow key={r.id} className="group duration-300 transition-colors md:hover:bg-slate-50/50">
                              <TableCell className="font-semibold py-4 text-slate-700 pl-6">
                                 {r.examName || 'N/A'}
                                 <div className="text-[10px] text-slate-400 font-bold uppercase">{r.className || 'N/A'}</div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase border border-blue-200">
                                       {r.term || 'N/A'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold">
                                       {r.semester || 'N/A'}
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-center">
                                 <span className={`text-base font-black ${!isPassing ? 'text-red-500' : 'text-slate-900'}`}>{r.marks}%</span>
                              </TableCell>
                              <TableCell className="text-center">
                                 <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-700 font-black text-xs border">
                                    {r.grade || calculateLetterGrade(r.marks)}
                                 </div>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                 <div className="flex justify-end">
                                    {isPassing ? (
                                       <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
                                          <CheckCircle2 className="w-3 h-3" /> PASSED
                                       </div>
                                    ) : (
                                       <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-md text-[10px] font-bold border border-rose-100">
                                          <AlertCircle className="w-3 h-3" /> FAILED
                                       </div>
                                    )}
                                 </div>
                              </TableCell>
                           </TableRow>
                        );
                     }) : (
                        <TableRow>
                           <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                              No records found for this semester.
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </div>
         </Card>
      </div>
   );
}
