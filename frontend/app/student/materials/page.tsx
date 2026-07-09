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
        console.error("Echec de connexion", err);
        toast.error("Impossible de se connecter aux serveurs");
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
      console.error("Echec de connexion", error);
      toast.error("Impossible de se connecter aux serveurs");
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
    const tid = toast.loading("Préparation du téléchargement...");

    try {
      const fullUrl = getFullUrl(mat.fileUrl);
      // 1. Fetch the file data directly
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('La réponse du serveur n\'était pas valide');

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
      toast.success("Connexion interrompue,Téléchargement lancé", { id: tid });
    } catch (err) {
      console.error("Echec de connexion:", err);
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
            <Archive size={14} /> Répertoire des connaissances
          </div>
          <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter sm:text-7xl italic uppercase">
            Ressources <span className="text-indigo-600">pédagogiques.</span>
          </h1>
        </div>

        <Select onValueChange={handleClassChange}>
          <SelectTrigger className="w-72 h-16 rounded-4xl bg-white border border-slate-100 md:hover:border-primary shadow-xl font-black italic uppercase text-xs px-8 ring-offset-indigo-600 focus:ring-indigo-600 transition-all duration-500">
            <SelectValue placeholder="CHOISIR LE GROUPE DE SUJETS" />
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
                Aucune classe inscrite trouvée
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Accès aux archives...</p>
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
                  Aucune ressource pédagogique trouvée
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
                  <Card className="rounded-2xl p-4.5 bg-white border border-slate-100 md:hover:border-primary shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden h-full flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600/10 group-hover:bg-blue-600 transition-colors" />

                    <div className="pl-1.5">
                      <div className="flex justify-between items-center mb-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                          {getFileIcon(mat.fileUrl)}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-blue-500 uppercase italic flex items-center gap-1">
                            <Layers size={10} /> {formatBytes(mat.fileSize)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-350 uppercase mt-0.5">
                            {new Date(mat.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-black italic uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {mat.title}
                        </h3>
                        <p className="text-slate-400 font-bold text-[11px] leading-snug italic line-clamp-2">
                          {mat.description || "Ressource pédagogique officielle."}
                        </p>
                      </div>

                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mt-2.5 mb-4">
                        <span>Prof: {mat.uploadedBy?.name || "Enseignant"}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!mat.fileUrl) {
                              toast.error("L'URL du fichier est manquante pour ce matériel.");
                              return;
                            }
                            const isPdf = mat.fileType?.includes('pdf') || mat.fileName?.toLowerCase().endsWith('.pdf');
                            let previewUrl = mat.fileUrl.replace('/upload/', '/upload/f_auto/');
                            if (isPdf && !previewUrl.toLowerCase().endsWith('.pdf')) {
                              previewUrl += '.pdf';
                            }
                            window.open(getFullUrl(previewUrl), "_blank", 'noopener,noreferrer');
                          }}
                          className="flex-1 h-8 rounded-lg border-slate-100 text-slate-700 font-bold text-[9px] uppercase hover:bg-slate-50 transition-all"
                        >
                          <Eye size={12} className="mr-1" /> Aperçu
                        </Button>

                        <Button
                          onClick={() => handleDownload(mat)}
                          className="flex-1 h-8 rounded-lg bg-rose-600 text-white font-bold text-[9px] uppercase hover:bg-rose-700 transition-all shadow-sm"
                        >
                          <Download size={12} className="mr-1" /> Obtenir
                        </Button>
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
