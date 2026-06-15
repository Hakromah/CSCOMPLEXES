/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
   User, Mail, MapPin, Calendar, Phone, ShieldCheck,
   GraduationCap, Camera, Save, KeyRound, Eye, EyeOff,
   BadgeCheck, Globe, Loader2, Landmark, Flag, Info,
   Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
   name: z.string().min(1, 'Le nom d\'identité est requis'),
   email: z.string().email('E-mail institutionnel requis'),
   phoneNumber: z.string().min(5, 'Un numéro de contact est requis'),
   address: z.string().min(5, 'Une adresse complète est requise'),
   birthCity: z.string().min(1, 'La ville de naissance est requise'),
   birthCountry: z.string().min(1, 'Le pays de naissance est requis'),
});

const passwordSchema = z.object({
   currentPassword: z.string().min(1, 'La clé actuelle est requise'),
   newPassword: z.string().min(6, '6 caractères minimum'),
});

export default function RedesignedStudentProfile() {
   const [loading, setLoading] = useState(true);
   const [showCurrentPwd, setShowCurrentPwd] = useState(false);
   const [showNewPwd, setShowNewPwd] = useState(false);
   const [studentData, setStudentData] = useState<any>(null);

   const profileForm = useForm<z.infer<typeof profileSchema>>({
      resolver: zodResolver(profileSchema),
      defaultValues: { name: '', email: '', phoneNumber: '', address: '', birthCity: '', birthCountry: '' }
   });

   const pwdForm = useForm<z.infer<typeof passwordSchema>>({
      resolver: zodResolver(passwordSchema),
      defaultValues: { currentPassword: '', newPassword: '' }
   });

   useEffect(() => {
      const fetchProfile = async () => {
         try {
            const res = await api.get('/auth/me');
            setStudentData(res.data);
            profileForm.reset({
               name: res.data.name,
               email: res.data.email,
               phoneNumber: res.data.phoneNumber || '',
               address: res.data.address || '',
               birthCity: res.data.birthCity || '',
               birthCountry: res.data.birthCountry || '',
            });
         } catch (e) {
            toast.error("La synchronisation du profil a échoué");
         } finally {
            setLoading(false);
         }
      };
      fetchProfile();
   }, [profileForm]);

   const onUpdate = async (values: z.infer<typeof profileSchema>) => {
      const tid = toast.loading("Synchronisation des dossiers...");
      try {
         await api.put('/student/profile/update', values);
         toast.success("L'identité a été mise à jour", { id: tid });
      } catch (e) {
         toast.error("La mise à jour a échoué", { id: tid });
      }
   };

   const onPwdSubmit = async (values: z.infer<typeof passwordSchema>) => {
      const tid = toast.loading('Sécurisation du compte...');
      try {
         await api.put('/student/profile/change-password', values);
         toast.success('La clé de sécurité a été mise à jour', { id: tid });
         pwdForm.reset();
      } catch (e) {
         toast.error('La mise à jour a échoué. Vérifiez le mot de passe actuel.', { id: tid });
      }
   };

   if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
         <Loader2 className="animate-spin text-indigo-600" size={40} />
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Chargement du portfolio numérique...</p>
      </div>
   );

   return (
      <div className="md:min-h-screen bg-[#F8FAFC] p-6 lg:p-10 space-y-10">
         <div className="max-w-7xl mx-auto space-y-[clamp(1rem,2vw+1rem,2rem)]">

            {/* Header Hero Section */}
            <div className="relative bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

               <div className="relative flex flex-col md:flex-row items-center gap-10">
                  <div className="relative group">
                     <div className="w-32 h-32 md:w-44 md:h-44 rounded-[3rem] bg-indigo-600 flex items-center justify-center text-white text-6xl font-black italic shadow-2xl">
                        {studentData?.name?.charAt(0)}
                     </div>
                     <Button className="absolute -bottom-2 -right-2 bg-white p-3 rounded-[clamp(1rem,2vw+1rem,2rem)] shadow-xl hover:scale-110 transition-transform text-indigo-600 border border-slate-100">
                        <Camera size={20} />
                     </Button>
                  </div>

                  <div className="text-center md:text-left space-y-4">
                     <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] px-4 tracking-widest uppercase italic">Étudiant enr</Badge>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-600 font-black text-[10px] px-4 italic uppercase flex gap-1 items-center">
                           <BadgeCheck size={12} />  Compte vérifié
                        </Badge>
                     </div>
                     <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter italic uppercase">{studentData?.name}</h1>
                     <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                        <span className="flex items-center gap-2"><GraduationCap size={16} className="text-indigo-500" /> ID: {studentData?.userId}</span>
                        <span className="flex items-center gap-2"><Globe size={16} className="text-indigo-500" /> {studentData?.email}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

               {/* Left Column: Fixed Registry Metadata */}
               <div className="lg:col-span-4 space-y-8">
                  <Card className="rounded-[2.5rem] border shadow-sm bg-white p-8 space-y-8 border-slate-100 md:hover:border-primary duration-500 transition-colors">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Info size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Dossier permanent</span>
                     </div>

                     <div className="space-y-6">
                        <MetadataItem label="Genre" value={studentData?.gender} icon={User} />
                        <MetadataItem label="Date de naissance" value={studentData?.birthDate} icon={Calendar} />
                        <MetadataItem label="Pays de naissance" value={studentData?.birthCountry} icon={Flag} />
                        <MetadataItem label="Créé par le système" value={new Date(studentData?.createdAt).toLocaleDateString()} icon={BadgeCheck} />
                     </div>

                     <Separator className="bg-slate-50" />

                     <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 italic">Note institutionnelle</p>
                        <p className="text-[11px] text-indigo-600 font-bold leading-relaxed">
                           Les données du registre sont synchronisées avec le Ministère de l'Éducation. Contactez l'administration pour toute correction d'identité.
                        </p>
                     </div>
                  </Card>
               </div>

               {/* Right Column: Editable Profile & Security */}
               <div className="lg:col-span-8 space-y-8">
                  <Card className="rounded-[3rem] border shadow-xl bg-white overflow-hidden border-slate-100 md:hover:border-primary duration-500 transition-colors">
                     <CardContent className="p-10">
                        <div className="flex items-center gap-3 mb-10">
                           <div className="h-2 w-10 bg-indigo-600 rounded-full" />
                           <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tight">Synchronisation des données de l'étudiant</h2>
                        </div>

                        <Form {...profileForm}>
                           <form onSubmit={profileForm.handleSubmit(onUpdate)} className="space-y-10">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <ProfileField form={profileForm} name="name" label="Identité légale" icon={User} />
                                 <ProfileField form={profileForm} name="email" label="Email institutionnel" icon={Mail} />
                                 <ProfileField form={profileForm} name="phoneNumber" label="Contact mobile" icon={Phone} />
                                 <ProfileField form={profileForm} name="birthCity" label="Ville natale" icon={Landmark} />
                                 <ProfileField form={profileForm} name="birthCountry" label="Pays de naissance" icon={Globe} />
                                 <ProfileField form={profileForm} name="address" label="Adresse résidentielle" icon={MapPin} fullWidth />
                              </div>

                              <Button type="submit" className="w-full h-16 bg-slate-900 md:hover:bg-primary text-white font-black rounded-[clamp(1rem,2vw+1rem,3rem)] transition-all duration-500 shadow-xl uppercase text-[11px] tracking-[0.2em]">
                                 <Save className="mr-3" size={18} /> Mise à jour du portfolio académique
                              </Button>
                           </form>
                        </Form>

                        <Separator className="my-12 bg-slate-50" />

                        <div className="space-y-8">
                           <div className="flex items-center gap-3">
                              <ShieldCheck className="text-rose-600" />
                              <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tight">Sécurité d'accès</h2>
                           </div>

                           <Form {...pwdForm}>
                              <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                 <FormField control={pwdForm.control} name="currentPassword" render={({ field }) => (
                                    <FormItem>
                                       <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Mot de passe actuel</FormLabel>
                                       <div className="relative">
                                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                          <FormControl><Input type={showCurrentPwd ? "text" : "password"} {...field} className="h-14 pl-12 pr-12 rounded-[clamp(1rem,2vw+1rem,2rem)] bg-slate-50 border-none font-bold md:hover:bg-indigo-50/50 md:hover:ring-2 md:hover:ring-indigo-600/20 transition-all duration-300" /></FormControl>
                                          <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                             {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                          </button>
                                       </div>
                                    </FormItem>
                                 )} />

                                 <FormField control={pwdForm.control} name="newPassword" render={({ field }) => (
                                    <FormItem>
                                       <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Nouveau mot de passe</FormLabel>
                                       <div className="relative">
                                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                          <FormControl><Input type={showNewPwd ? "text" : "password"} {...field} className="h-14 pl-12 pr-12 rounded-[clamp(1rem,2vw+1rem,2rem)] bg-slate-50 border-none font-bold md:hover:bg-indigo-50/50 md:hover:ring-2 md:hover:ring-indigo-600/20 transition-all duration-300" /></FormControl>
                                          <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                             {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                          </button>
                                       </div>
                                    </FormItem>
                                 )} />

                                 <Button type="submit" className="md:col-span-2 h-14 bg-rose-600 md:hover:bg-primary text-white font-black rounded-[clamp(1rem,2vw+1rem,2rem)] transition-all duration-500 uppercase text-[10px] tracking-widest">
                                    Révision des identifiants de sécurité
                                 </Button>
                              </form>
                           </Form>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>
         </div>
      </div>
   );
}
// --- HELPER COMPONENTS ---

function MetadataItem({ label, value, icon: Icon }: any) {
   return (
      <div className="flex items-center gap-4 group">
         <div className="p-3 rounded-[clamp(1rem,2vw+1rem,2rem)] bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <Icon size={18} />
         </div>
         <div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-700 italic">{value || 'UNSET'}</p>
         </div>
      </div>
   );
}

function ProfileField({ form, name, label, icon: Icon, fullWidth }: any) {
   return (
      <FormField control={form.control} name={name} render={({ field }) => (
         <FormItem className={fullWidth ? "md:col-span-2" : ""}>
            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</FormLabel>
            <div className="relative group">
               <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                  <Icon size={18} />
               </div>
               <FormControl>
                  <Input {...field} className="h-14 pl-14 rounded-[clamp(1rem,2vw+1rem,2rem)] bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-600/10 md:hover:bg-indigo-50/50 md:hover:ring-2 md:hover:ring-indigo-600/20 transition-all duration-300" />
               </FormControl>
            </div>
            <FormMessage className="text-[10px] font-bold" />
         </FormItem>
      )} />
   );
}
