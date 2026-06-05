/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import {
  Download, FileText, Archive, Loader2, Eye, FileImage, FileType, Calendar, Layers
} from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function StudentMaterialsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fetchingMaterials, setFetchingMaterials] = useState(false);

  // 1. Initial Load: Fetch the list of classes the student is enrolled in
  useEffect(() => {
    const fetchEnrolledClasses = async () => {
      try {
        // Use the existing student classes endpoint
        const res = await api.get('/student/classes');
        setClasses(res.data || []);
      } catch (err) {
        console.error("Failed to load classes:", err);
        toast.error("Could not sync your classroom registry");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledClasses();
  }, []);

  // 2. Selection Change: Fetch materials for the specific class ID
  const handleClassChange = async (classId: string) => {
    setFetchingMaterials(true);
    setSelectedClassId(classId);
    try {
      // Fetch materials for a specific class ID explicitly via Strapi
      const res = await api.get(`/student/materials/${classId}`);
      setMaterials(res.data);
    } catch (error: any) {
      console.error("Material Fetch Error:", error);
      toast.error("Failed to retrieve materials for this unit");
      setMaterials([]);
    } finally {
      setFetchingMaterials(false);
    }
  };

  // Helper: Professional File Size Formatting
  const formatBytes = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper: Determine Icon by File Extension
  const getFileIcon = (url: string) => {
    if (!url) return <FileType size={32} />;
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <FileImage size={32} />;
    if (ext === 'pdf') return <FileText size={32} />;
    return <FileType size={32} />;
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://192.168.1.137:1338';
    return `${baseUrl}${url}`;
  };

  const handleDownload = async (mat: any) => {
    if (!mat.fileUrl) return;
    const tid = toast.loading("Preparing download...");

    try {
      const fullUrl = getFullUrl(mat.fileUrl);
      // 1. Fetch the file data directly
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();

      // 2. Create a temporary local URL for the file blob
      const url = window.URL.createObjectURL(blob);

      // 3. Create a hidden link and click it
      const link = document.createElement('a');
      link.href = url;

      // Use the clean filename from your database, or reliably extract the filename from the URL to preserve things like .docx
      const extractedName = mat.fileUrl ? mat.fileUrl.split('/').pop() : 'document.pdf';
      const fileName = mat.fileName || extractedName;
      link.setAttribute('download', fileName);

      document.body.appendChild(link);
      link.click();

      // 4. Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started", { id: tid });
    } catch (err) {
      console.error("Download error:", err);
      // Fallback: just open the URL in a new tab if fetch fails
      const fullUrl = getFullUrl(mat.fileUrl);
      window.open(fullUrl, '_blank');
      toast.dismiss(tid);
    }
  };


  return (
    <div className="md:min-h-screen bg-[#F8FAFC] p-6 lg:p-10 space-y-10">
      {/* Header Section */}
      <header className="md:max-w-6xl mx-auto flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em]">
            <Archive size={14} /> Knowledge Repository
          </div>
          <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter sm:text-7xl italic uppercase">
            Study <span className="text-indigo-600">Assets.</span>
          </h1>
        </div>

        <Select onValueChange={handleClassChange}>
          <SelectTrigger className="w-72 h-16 rounded-4xl bg-white border border-slate-100 md:hover:border-primary shadow-xl font-black italic uppercase text-xs px-8 ring-offset-indigo-600 focus:ring-indigo-600 transition-all duration-500">
            <SelectValue placeholder="SELECT SUBJECT GROUP" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            {classes.length > 0 ? (
              classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="font-bold p-3 cursor-pointer">
                  {c.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-xs font-bold text-slate-400 uppercase italic text-center">
                No Enrolled Classes Found
              </div>
            )}
          </SelectContent>
        </Select>
      </header>

      {/* Materials Display Area */}
      <main className="max-w-6xl mx-auto">
        {fetchingMaterials ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-300" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Accessing Archives...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {materials.length === 0 && selectedClassId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full h-96 flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 md:hover:border-primary duration-500 transition-colors italic font-black text-slate-200 uppercase tracking-tighter text-4xl"
                >
                  Empty Unit Archives
                </motion.div>
              )}

              {materials.map((mat) => (
                <motion.div
                  key={mat.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="rounded-[3.5rem] p-10 bg-white border border-slate-100 md:hover:border-primary shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden h-full flex flex-col justify-between">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

                    <div>
                      <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="bg-indigo-50 p-5 rounded-3xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                          {getFileIcon(mat.fileUrl)}
                        </div>

                        <div className="flex gap-2">
                          {/* PREVIEW BUTTON: No attachment flags, just f_auto and conditional .pdf */}
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (!mat.fileUrl) {
                                toast.error("File URL is missing for this material.");
                                return;
                              }
                              const isPdf = mat.fileType?.includes('pdf') || mat.fileName?.toLowerCase().endsWith('.pdf');
                              let previewUrl = mat.fileUrl.replace('/upload/', '/upload/f_auto/');
                              if (isPdf && !previewUrl.toLowerCase().endsWith('.pdf')) {
                                previewUrl += '.pdf';
                              }
                              window.open(getFullUrl(previewUrl), "_blank", 'noopener,noreferrer');
                            }}
                            className="rounded-2xl border-slate-100 text-slate-400 md:hover:border-primary md:hover:text-primary duration-500 transition-colors font-black text-[10px] tracking-widest h-10 px-4 uppercase"
                          >
                            <Eye size={14} className="mr-2" /> Preview
                          </Button>

                          <Button
                            onClick={() => handleDownload(mat)}
                            className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-black italic uppercase text-[10px] md:hover:bg-primary duration-500 shadow-xl shadow-rose-200 transition-all"
                          >
                            <Download size={14} className="mr-2" /> Get
                          </Button>

                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
                          {mat.title}
                        </h3>
                        <p className="text-slate-400 font-bold text-sm leading-relaxed italic line-clamp-2">
                          {mat.description || "Official course material for your curriculum."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-50 relative z-10">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 italic shadow-sm">
                            {mat.uploadedBy?.name?.charAt(0) || "T"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic leading-none">
                              {mat.uploadedBy?.name || "Faculty Member"}
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase mt-1">Instructor</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[9px] px-4 py-1.5 uppercase tracking-tighter rounded-lg">
                          <Calendar size={10} className="mr-1.5" />
                          {new Date(mat.createdAt).toLocaleDateString()}
                        </Badge>
                        <span className="text-[9px] font-black text-indigo-400 uppercase italic flex items-center gap-1 mr-1">
                          <Layers size={10} /> {formatBytes(mat.fileSize)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
