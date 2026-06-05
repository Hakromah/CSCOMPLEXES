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
         toast.error('System synchronization failed');
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
      if (!confirm("Are you sure? This will remove the file from Cloudinary permanently.")) return;

      const t = toast.loading('Purging digital asset...');
      try {
         await api.delete(`/api/admin/materials/${id}`);
         toast.success('Asset removed from registry', { id: t });
         fetchData();
      } catch (err) {
         toast.error('System bypass failed: Could not delete', { id: t });
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
      const tid = toast.loading("Preparing download...");

      try {
         const response = await fetch(actualUrl);
         if (!response.ok) throw new Error('Network response was not ok');
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
         toast.success("Download started", { id: tid });
      } catch (err) {
         console.error("Download error:", err);
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
                  <HardDrive size={14} /> Global Asset Registry
               </div>
               <h1 className="text-[clamp(1.2rem,2vw+1rem,3rem)] font-black text-slate-900 tracking-tighter  italic uppercase leading-none">
                  Material <span className="text-rose-600">Admin.</span>
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
                  EXECUTE
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
                  Waiting for analytics data...
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
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                              <Card className="rounded-[clamp(1rem,2vw+1rem,2rem)] p-8 border border-primary/0 lg:hover:border-primary duration-500 shadow-sm bg-white hover:shadow-2xl transition-all group flex flex-col justify-between h-full relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-2 h-full bg-rose-600/10 group-hover:bg-rose-600 transition-colors" />

                                 <div>
                                    <div className="flex justify-between items-start mb-6">
                                       <Badge className="bg-slate-900 text-[9px] font-black uppercase tracking-widest italic rounded-lg">
                                          ID: #{m.id}
                                       </Badge>
                                       <Button
                                          onClick={() => deleteMaterial(m.id)}
                                          variant="ghost"
                                          size="icon"
                                          className="text-slate-200 hover:text-rose-600 rounded-full"
                                       >
                                          <Trash2 size={20} />
                                       </Button>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                       {isPdf ? <FileText className="text-rose-600" size={20} /> : <ImageIcon className="text-indigo-600" size={20} />}
                                       <h3 className="text-xl font-black italic uppercase text-slate-900 truncate tracking-tighter">
                                          {m.fileName}
                                       </h3>
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs italic line-clamp-2 mb-6">{m.title}</p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                       {(m.targetClasses || (m.classe ? [m.classe] : [])).map((c: any) => (
                                          <Badge key={c.id || 'no-class'} className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase italic">
                                             {c.name || 'Unassigned'}
                                          </Badge>
                                       ))}
                                       {!(m.targetClasses?.length || m.classe) && (
                                          <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase italic">
                                             No Class
                                          </Badge>
                                       )}
                                    </div>
                                 </div>

                                 <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
                                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
                                          <User size={14} className="text-rose-600" /> Uploaded: {m.uploadedBy?.name}
                                       </div>
                                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
                                          <Calendar size={14} className="text-rose-600" /> Date: {new Date(m.createdAt).toLocaleDateString()}
                                       </div>
                                    </div>

                                    <div className="flex gap-3">
                                       <Button
                                          onClick={() => handlePreview(m)}
                                          className="flex-1 h-12 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black italic uppercase text-[10px] hover:bg-slate-50 shadow-sm"
                                       >
                                          <Eye size={16} className="mr-2" /> Preview
                                       </Button>
                                       <Button
                                          onClick={() => handleDownload(m)}
                                          className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-black italic uppercase text-[10px] hover:bg-slate-900 shadow-xl shadow-rose-200 transition-all"
                                       >
                                          <Download size={16} className="mr-2" /> Download
                                       </Button>
                                    </div>
                                 </div>
                              </Card>
                           </motion.div>
                        )
                     })}
                  </AnimatePresence>
               </div>
            )}
         </main>
      </div>
   );
}



// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState } from 'react';
// import api from '@/lib/api';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import {
//    Trash2, Download, Eye, Search, HardDrive,
//    BarChart3, User, Loader2, Calendar, FileText, Image as ImageIcon
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { motion, AnimatePresence } from 'framer-motion';

// export default function AdminMaterialsPage() {
//    const [materials, setMaterials] = useState<any[]>([]);
//    const [analytics, setAnalytics] = useState<any[]>([]);
//    const [query, setQuery] = useState('');
//    const [loading, setLoading] = useState(true);

//    const fetchData = async () => {
//       setLoading(true);
//       try {
//          const endpoint = query
//             ? `/api/admin/materials/search?q=${query}`
//             : '/api/admin/materials';

//          const [matRes, analyticsRes] = await Promise.all([
//             api.get(endpoint),
//             api.get('/api/admin/materials/analytics/downloads-per-class')
//          ]);

//          setMaterials(matRes.data);
//          setAnalytics(analyticsRes.data);
//       } catch (err) {
//          toast.error('System synchronization failed');
//          console.error(err);
//       } finally {
//          setLoading(false);
//       }
//    };

//    useEffect(() => {
//       fetchData();
//    }, []);

//    const deleteMaterial = async (id: number) => {
//       if (!confirm("Are you sure? This will remove the file from Cloudinary permanently.")) return;

//       const t = toast.loading('Purging digital asset...');
//       try {
//          await api.delete(`/api/admin/materials/${id}`);
//          toast.success('Asset removed from registry', { id: t });
//          fetchData();
//       } catch (err) {
//          toast.error('System bypass failed: Could not delete', { id: t });
//          console.error(err);
//       }
//    };

//    // FIXED PREVIEW LOGIC
//    const handlePreview = (m: any) => {
//       if (!m.fileUrl) return;

//       // 1. Check if it's a PDF
//       const isPdf = m.fileType?.includes('pdf') || m.fileName?.toLowerCase().endsWith('.pdf');

//       // 2. Prepare the optimized URL
//       let previewUrl = m.fileUrl.replace('/upload/', '/upload/f_auto,q_auto/');

//       // 3. FIX: Only append .pdf if the URL doesn't already have it
//       if (isPdf && !previewUrl.toLowerCase().endsWith('.pdf')) {
//          previewUrl = `${previewUrl}.pdf`;
//       }

//       // 4. Open with no-referrer to bypass LMS token conflicts with Cloudinary
//       window.open(previewUrl, '_blank', 'noopener,noreferrer');
//    };

//    const handleDownload = async (mat: any) => {
//       if (!mat.fileUrl) return;
//       const tid = toast.loading("Preparing download...");

//       try {
//          // 1. Fetch the file data directly
//          const response = await fetch(mat.fileUrl);
//          if (!response.ok) throw new Error('Network response was not ok');

//          const blob = await response.blob();

//          // 2. Create a temporary local URL for the file blob
//          const url = window.URL.createObjectURL(blob);

//          // 3. Create a hidden link and click it
//          const link = document.createElement('a');
//          link.href = url;

//          // Use the clean filename from your database
//          const fileName = mat.fileName || 'document.pdf';
//          link.setAttribute('download', fileName);

//          document.body.appendChild(link);
//          link.click();

//          // 4. Cleanup
//          link.parentNode?.removeChild(link);
//          window.URL.revokeObjectURL(url);
//          toast.success("Download started", { id: tid });
//       } catch (err) {
//          console.error("Download error:", err);
//          // Fallback: just open the URL in a new tab if fetch fails
//          window.open(mat.fileUrl, '_blank');
//          toast.dismiss(tid);
//       }
//    };

//    return (
//       <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 space-y-10">
//          {/* Header */}
//          <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
//             <div className="space-y-2">
//                <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-[0.4em]">
//                   <HardDrive size={14} /> Global Asset Registry
//                </div>
//                <h1 className="text-5xl font-black text-slate-900 tracking-tighter sm:text-7xl italic uppercase leading-none">
//                   Material <span className="text-rose-600">Admin.</span>
//                </h1>
//             </div>

//             <div className="flex w-full md:w-auto gap-3">
//                <div className="relative flex-1 md:w-80">
//                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                   <Input
//                      placeholder="Filter archives..."
//                      className="pl-12 h-14 rounded-2xl border-none shadow-lg bg-white font-bold"
//                      value={query}
//                      onChange={e => setQuery(e.target.value)}
//                      onKeyDown={(e) => e.key === 'Enter' && fetchData()}
//                   />
//                </div>
//                <Button onClick={fetchData} className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black italic hover:bg-rose-600 transition-colors">
//                   EXECUTE
//                </Button>
//             </div>
//          </header>

//          {/* Analytics Grid */}
//          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
//             {analytics.map((item, idx) => (
//                <Card key={idx} className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex items-center justify-between">
//                   <div>
//                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{item.className}</p>
//                      <h4 className="text-2xl font-black italic text-slate-900">
//                         {item.downloads} <span className="text-[10px] uppercase font-bold text-slate-400 not-italic">DLs</span>
//                      </h4>
//                   </div>
//                   <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
//                      <BarChart3 size={20} />
//                   </div>
//                </Card>
//             ))}
//          </div>

//          {/* Materials Grid */}
//          <main className="max-w-7xl mx-auto">
//             {loading ? (
//                <div className="h-96 flex items-center justify-center">
//                   <Loader2 className="animate-spin text-rose-600" size={40} />
//                </div>
//             ) : (
//                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                   <AnimatePresence mode="popLayout">
//                      {materials.map(m => {
//                         const isPdf = m.fileName?.toLowerCase().endsWith('.pdf') || m.fileType?.includes('pdf');

//                         return (
//                            <motion.div
//                               key={m.id}
//                               layout
//                               initial={{ opacity: 0, scale: 0.9 }}
//                               animate={{ opacity: 1, scale: 1 }}
//                               exit={{ opacity: 0, scale: 0.9 }}
//                            >
//                               <Card className="rounded-[3rem] p-8 border-none shadow-sm bg-white hover:shadow-2xl transition-all group flex flex-col justify-between h-full relative overflow-hidden">
//                                  <div className="absolute top-0 left-0 w-2 h-full bg-rose-600/10 group-hover:bg-rose-600 transition-colors" />

//                                  <div>
//                                     <div className="flex justify-between items-start mb-6">
//                                        <Badge className="bg-slate-900 text-[9px] font-black uppercase tracking-widest italic rounded-lg">
//                                           ID: #{m.id}
//                                        </Badge>
//                                        <Button
//                                           onClick={() => deleteMaterial(m.id)}
//                                           variant="ghost"
//                                           size="icon"
//                                           className="text-slate-200 hover:text-rose-600 rounded-full"
//                                        >
//                                           <Trash2 size={20} />
//                                        </Button>
//                                     </div>

//                                     <div className="flex items-center gap-2 mb-2">
//                                        {isPdf ? <FileText className="text-rose-600" size={20} /> : <ImageIcon className="text-indigo-600" size={20} />}
//                                        <h3 className="text-xl font-black italic uppercase text-slate-900 truncate tracking-tighter">
//                                           {m.fileName}
//                                        </h3>
//                                     </div>
//                                     <p className="text-slate-400 font-bold text-xs italic line-clamp-2 mb-6">{m.title}</p>

//                                     <div className="flex flex-wrap gap-2 mb-6">
//                                        {m.targetClasses.map((c: any) => (
//                                           <Badge key={c.id} className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase italic">
//                                              {c.name}
//                                           </Badge>
//                                        ))}
//                                     </div>
//                                  </div>

//                                  <div className="space-y-4">
//                                     <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
//                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
//                                           <User size={14} className="text-rose-600" /> Uploaded: {m.uploadedBy?.name}
//                                        </div>
//                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
//                                           <Calendar size={14} className="text-rose-600" /> Date: {new Date(m.createdAt).toLocaleDateString()}
//                                        </div>
//                                     </div>

//                                     <div className="flex gap-3">
//                                        <Button
//                                           onClick={() => handlePreview(m)}
//                                           className="flex-1 h-12 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black italic uppercase text-[10px] hover:bg-slate-50 shadow-sm"
//                                        >
//                                           <Eye size={16} className="mr-2" /> Preview
//                                        </Button>
//                                        <Button
//                                           onClick={() => handleDownload(m)}
//                                           className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-black italic uppercase text-[10px] hover:bg-slate-900 shadow-xl shadow-rose-200 transition-all"
//                                        >
//                                           <Download size={16} className="mr-2" /> Download
//                                        </Button>
//                                     </div>
//                                  </div>
//                               </Card>
//                            </motion.div>
//                         )
//                      })}
//                   </AnimatePresence>
//                </div>
//             )}
//          </main>
//       </div>
//    );
// }
