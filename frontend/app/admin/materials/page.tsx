/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
   Trash2, Download, Eye, Search, HardDrive,
   BarChart3, User, Loader2, Calendar, FileText, Image as ImageIcon,
   TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminMaterialsPage() {
   const [materials, setMaterials] = useState<any[]>([]);
   const [analytics, setAnalytics] = useState<any[]>([]); // ✅ Analytics State
   const [query, setQuery] = useState('');
   const [loading, setLoading] = useState(true);

   // --- DATA FETCHING ---
   const fetchData = async () => {
      setLoading(true);
      try {
         // ✅ Fetches registry data and your custom analytics logic
         const [matRes, analyticsRes] = await Promise.all([
            api.get('/admin/materials'),
            api.get('/admin/materials/analytics')
         ]);

         const rawData = matRes.data || [];
         const filtered = query
            ? rawData.filter((m: any) =>
               m.fileName?.toLowerCase().includes(query.toLowerCase()) ||
               m.title?.toLowerCase().includes(query.toLowerCase())
            )
            : rawData;

         setMaterials(filtered);
         setAnalytics(analyticsRes.data || []);
      } catch (err) {
         toast.error('Échec de la synchronisation du système.');
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   // --- ACTIONS ---
   const deleteMaterial = async (id: number) => {
      if (!confirm("Êtes-vous sûr ? Cela supprimera définitivement le fichier de Cloudinary.")) return;

      const t = toast.loading('Purge de l\'actif numérique...');
      try {
         await api.delete(`/api/admin/materials/${id}`);
         toast.success('Ressource supprimée du registre.', { id: t });
         fetchData();
      } catch (err) {
         toast.error('Échec du contournement du système : impossible de supprimer', { id: t });
         console.error(err);
      }
   };

   const getValidUrl = (m: any) => {
      let raw = m.fileUrl || m.file?.url;
      if (!raw) return null;
      if (raw.startsWith('/')) {
         raw = (process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1338') + raw;
      }
      return raw;
   };

   const handlePreview = (m: any) => {
      const actualUrl = getValidUrl(m);
      if (!actualUrl) return;

      const isPdf = m.fileType?.includes('pdf') || m.fileName?.toLowerCase().endsWith('.pdf') || m.file?.mime?.includes('pdf');
      let previewUrl = actualUrl.replace('/upload/', '/upload/f_auto,q_auto/');

      if (isPdf && !previewUrl.toLowerCase().endsWith('.pdf')) {
         previewUrl = `${previewUrl}.pdf`;
      }
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
   };

   const handleDownload = async (mat: any) => {
      const actualUrl = getValidUrl(mat);
      if (!actualUrl) return;
      const tid = toast.loading("Preparation du téléchargement...");

      try {
         const response = await fetch(actualUrl);
         if (!response.ok) throw new Error('La réponse du réseau n\'était pas correcte');
         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         const fileName = mat.fileName || 'document.pdf';
         link.setAttribute('download', fileName);
         document.body.appendChild(link);
         link.click();
         link.parentNode?.removeChild(link);
         window.URL.revokeObjectURL(url);
         toast.success("Téléchargement lancé", { id: tid });
      } catch (err) {
         console.error("Erreur de téléchargement:", err);
         window.open(actualUrl, '_blank');
         toast.dismiss(tid);
      }
   };

   return (
      <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)]">
         {/* 1. Header Section */}
         <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-[0.4em]">
                  <HardDrive size={14} /> Registre du Matériel Global
               </div>
               <h1 className="text-[clamp(1.2rem,2vw+1rem,3rem)] font-black text-slate-900 tracking-tighter  italic uppercase leading-none">
                  Matériel <span className="text-rose-600">Admin.</span>
               </h1>
            </div>

            <div className="flex w-full md:w-auto gap-3">
               <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                     placeholder="Filter archives..."
                     className="pl-12 h-14 rounded-[clamp(1rem,2vw+1rem,2rem)] border-none shadow-lg bg-white font-bold"
                     value={query}
                     onChange={e => setQuery(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                  />
               </div>
               <Button onClick={fetchData} className="h-14 px-8 bg-slate-900 text-white rounded-[clamp(1rem,2vw+1rem,2rem)] font-black italic hover:bg-rose-600 transition-colors">
                  EXECUTER
               </Button>
            </div>
         </header>

         {/* 2. ✅ INTEGRATED DOWNLOAD ANALYTICS MINI-GRID */}
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
            {analytics.length > 0 ? (
               analytics.map((item, idx) => (
                  <Card key={idx} className="p-6 rounded-[clamp(1rem,2vw+1rem,2rem)] shadow-sm border border-primary/0 lg:hover:border-primary duration-300 bg-white flex items-center justify-between border-l-4">
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                           {item.className}
                        </p>
                        <div className="flex items-center gap-2">
                           <h4 className="text-2xl font-black italic text-slate-900">{item.downloads}</h4>
                           <TrendingUp size={14} className="text-emerald-500" />
                        </div>
                     </div>
                     <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-[clamp(1rem,2vw+1rem,2rem)] flex items-center justify-center">
                        <BarChart3 size={20} />
                     </div>
                  </Card>
               ))
            ) : (
               <div className="col-span-full py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">
                  En attente des données d'analyse...
               </div>
            )}
         </div>

         {/* 3. Materials Grid */}
         <main className="max-w-7xl mx-auto">
            {loading ? (
               <div className="h-96 flex items-center justify-center">
                  <Loader2 className="animate-spin text-rose-600" size={40} />
               </div>
            ) : (
            <div className="max-h-[920px] overflow-y-auto pr-1 p-2">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                     {materials.map(m => {
                        const isPdf = m.fileName?.toLowerCase().endsWith('.pdf') || m.fileType?.includes('pdf');

                        return (
                           <motion.div
                              key={m.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                           >
                              <Card className="rounded-xl p-4 border border-slate-100 md:hover:border-primary duration-500 shadow-sm bg-white hover:shadow-md transition-all group flex flex-col justify-between h-full relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600/10 group-hover:bg-rose-600 transition-colors" />

                                 <div className="pl-1.5">
                                    <div className="flex justify-between items-center mb-2.5">
                                       <Badge className="bg-slate-955 text-[9px] font-black uppercase tracking-widest italic rounded px-2 py-0.5">
                                          ID: #{m.id}
                                       </Badge>
                                       <div className="flex items-center gap-1.5">
                                          {(m.targetClasses || (m.classe ? [m.classe] : [])).map((c: any) => (
                                             <Badge key={c.id || 'no-class'} className="bg-blue-50 text-blue-600 border-none font-bold text-[9px] uppercase px-1.5 py-0.5 rounded">
                                                {c.name || 'Non assigné'}
                                             </Badge>
                                          ))}
                                          {!(m.targetClasses?.length || m.classe) && (
                                             <Badge className="bg-slate-50 text-slate-400 border-none font-bold text-[9px] uppercase px-1.5 py-0.5 rounded">
                                                Aucune classe
                                             </Badge>
                                          )}
                                          <Button
                                             onClick={() => deleteMaterial(m.id)}
                                             variant="ghost"
                                             size="icon"
                                             className="text-slate-300 hover:text-rose-600 rounded-full h-7 w-7 transition-colors ml-1"
                                          >
                                             <Trash2 size={14} />
                                          </Button>
                                       </div>
                                    </div>

                                    <div className="flex items-start gap-2 mb-1.5">
                                       {isPdf ? <FileText className="text-rose-600 shrink-0 mt-0.5" size={15} /> : <ImageIcon className="text-indigo-600 shrink-0 mt-0.5" size={15} />}
                                       <div className="min-w-0">
                                          <h3 className="text-xs font-black italic uppercase text-slate-900 truncate tracking-tight" title={m.fileName}>
                                             {m.fileName}
                                          </h3>
                                          <p className="text-slate-400 font-bold text-[10px] mt-0.5 line-clamp-1">{m.title}</p>
                                       </div>
                                    </div>

                                    <div className="text-[10px] font-bold text-slate-400 flex flex-wrap items-center gap-1.5 mt-2 mb-3.5">
                                       <span>Par: {m.uploadedBy?.name || 'Admin'}</span>
                                       <span>•</span>
                                       <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex gap-2">
                                       <Button
                                          onClick={() => handlePreview(m)}
                                          className="flex-1 h-8 rounded-lg bg-white border border-slate-100 text-slate-700 font-bold uppercase text-[9px] hover:bg-slate-50 transition-all"
                                       >
                                          <Eye size={12} className="mr-1" /> Aperçu
                                       </Button>
                                       <Button
                                          onClick={() => handleDownload(m)}
                                          className="flex-1 h-8 rounded-lg bg-rose-600 text-white font-bold uppercase text-[9px] hover:bg-rose-700 transition-all shadow-sm"
                                       >
                                          <Download size={12} className="mr-1" /> Télécharger
                                       </Button>
                                    </div>
                                 </div>
                              </Card>
                           </motion.div>
                        )
                     })}
                  </AnimatePresence>
               </div>
            </div>
            )}
         </main>
      </div>
   );
}
