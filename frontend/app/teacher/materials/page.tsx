/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import {
  FileUp, FileText, Trash2, Layers, BookOpen,
  Loader2, Plus, X, Monitor, Download, Calendar,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      const [matRes, classRes] = await Promise.all([
        api.get('/teacher/materials'),
        api.get('/teacher/materials/my-classes')
      ]);
      setMaterials(matRes.data);
      setClasses(classRes.data);
    } catch (e: any) {
      // Log the specific error to help with debugging
      console.error("Statut : Erreur de synchronisation", e.response?.status);
      console.error("Data : Erreur de synchronisation", e.response?.data);
      toast.error("Echec de la synchronisation des ressources de la classe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async () => {
    if (!file || !title || selectedClasses.length === 0) {
      return toast.error("Veuillez remplir tous les champs requis");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    selectedClasses.forEach(id => formData.append('classIds', String(id)));

    setUploading(true);
    try {
      await api.post('/teacher/materials/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success("Matériau publié avec succès");
      setIsUploadOpen(false);
      resetForm();
      fetchData(); // Refresh the list
    } catch (e: any) {
      console.error("Statut : Echec du telechargement", e.response?.status);
      console.error("Data : Echec du telechargement", e.response?.data);
      toast.error("Echec du telechargement");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setSelectedClasses([]);
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (id: number) => {
    const tid = toast.loading("Suppression de la ressource...");
    try {
      await api.delete(`/teacher/materials/${id}`);
      toast.success("Suppression réussie", { id: tid });
      fetchData();
    } catch (e) {
      toast.error("Action impossible", { id: tid });
      console.log(e);
    }
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1338';
    return `${baseUrl}${url}`;
  };

  const handleDownload = async (mat: any) => {
    if (!mat.fileUrl) return;
    const tid = toast.loading("Préparation du téléchargement...");

    try {
      const fullUrl = getFullUrl(mat.fileUrl);
      // 1. Fetch the file data directly
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('La réponse du réseau n\'était pas correcte');

      const blob = await response.blob();

      // 2. Create a temporary local URL for the file blob
      const url = window.URL.createObjectURL(blob);

      // 3. Create a hidden link and click it
      const link = document.createElement('a');
      link.href = url;

      // Use the clean filename from your database
      const fileName = mat.fileName || 'document.pdf';
      link.setAttribute('download', fileName);

      document.body.appendChild(link);
      link.click();

      // 4. Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Téléchargement commencé", { id: tid });
    } catch (err) {
      console.error("Erreur de téléchargement", err);
      // Fallback: just open the URL in a new tab if fetch fails
      window.open(getFullUrl(mat.fileUrl), '_blank');
      toast.dismiss(tid);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="md:min-h-screen bg-[#F8FAFC] p-[clamp(1.5rem,2vw+0.5rem,3rem)] lg:p-10 space-y-[clamp(1rem,2vw+0.5rem,3rem)]">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-[clamp(1rem,2vw+0.5rem,3rem)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
            <Monitor size={14} /> Gestion du curriculum
          </div>
          <h1 className="text-[clamp(1.2rem,2vw+0.5rem,2.2rem)] font-black text-slate-900 tracking-tighter italic uppercase">
            Ressources d'apprentissage <span className="text-primary">.</span>
          </h1>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="bg-slate-900 hover:bg-blue-600 text-white rounded-[clamp(1rem,2vw+0.5rem,3rem)] h-14 px-8 font-black shadow-xl">
          <Plus size={20} className="mr-2" /> PUBLIER RESSOURCE
        </Button>
      </header>

      {/* Materials Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {materials.map((mat) => (
            <motion.div key={mat.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Card className="rounded-[clamp(1rem,2vw+0.5rem,3rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white p-8 hover:shadow-2xl h-full flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <FileText size={24} />
                    </div>
                    <Button onClick={() => handleDelete(mat.id)} variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500 rounded-full transition-colors">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tight uppercase text-slate-900 leading-none mb-3 truncate">{mat.title}</h3>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed line-clamp-2 mb-6">{mat.description}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {mat.targetClasses.map((c: any) => (
                      <Badge key={c.id} className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none font-black text-[9px] tracking-tighter italic px-2">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                  {/* The Footer Section */}
                  <div className="flex items-center justify-between py-5 border-t flex-wrap border-slate-50">
                    <div className="flex flex-col gap-1 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} /> {new Date(mat.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-500/60">
                        <FileText size={12} /> {formatBytes(mat.fileSize)}
                      </div>
                    </div>

                    <div className="flex gap-5 pt-3">
                      {/* PREVIEW BUTTON: No attachment flags, just f_auto and conditional .pdf */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const isPdf = mat.fileType?.includes('pdf') || mat.fileName?.toLowerCase().endsWith('.pdf');
                          let previewUrl = getFullUrl(mat.fileUrl).replace('/upload/', '/upload/f_auto/');
                          if (isPdf && !previewUrl.toLowerCase().endsWith('.pdf')) {
                            previewUrl += '.pdf';
                          }
                          window.open(previewUrl, "_blank", 'noopener,noreferrer');
                        }}
                        className="rounded-2xl border-slate-100 text-slate-400 hover:text-primary font-black text-[10px] tracking-widest h-10 px-4 uppercase"
                      >
                        <Eye size={14} className="mr-2" /> Aperçu
                      </Button>
                      <Button
                        onClick={() => handleDownload(mat)}
                        className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-black italic uppercase text-[10px] hover:bg-slate-900 shadow-xl shadow-rose-200 transition-all"
                      >
                        <Download size={14} className="mr-2" /> Télécharger
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="rounded-[3rem] p-10 sm:max-w-[500px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase">Publier une <span className="text-primary">Ressource.</span></DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 italic">Sélectionnez les fichiers à déployer en classe.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            <Input placeholder="Titre de la ressource" value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/20" />
            <textarea placeholder="Détails pédagogiques..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl bg-slate-50 border-none p-4 font-bold text-sm min-h-[120px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 resize-none" />

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Déployer en classe</p>
              <div className="flex flex-wrap gap-2">
                {classes.map(c => (
                  <Badge
                    key={c.id}
                    onClick={() => setSelectedClasses(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                    className={`cursor-pointer h-10 px-4 rounded-xl font-bold transition-all border-none ${selectedClasses.includes(c.id) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                  >
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-slate-50 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center max-w-full">
                <FileUp className={`w-10 h-10 mb-2 ${file ? 'text-primary' : 'text-slate-200 group-hover:text-primary'}`} />
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-tighter italic truncate w-full max-w-[250px]">
                  {file ? file.name : 'Sélectionner PDF, DOCX, ou Image'}
                </p>
              </div>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <DialogFooter className="mt-8">
            <Button disabled={uploading} onClick={handleUpload} className="w-full h-16 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-3xl transition-all shadow-xl uppercase text-[11px] tracking-[0.2em]">
              {uploading ? <Loader2 className="animate-spin" /> : 'AUTHORISER LA PUBLICATION'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
