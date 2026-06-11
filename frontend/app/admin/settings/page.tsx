/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  BadgeCheck,
  Settings2,
  BellRing
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(1, { message: 'Le nom est requis' }),
  email: z.string().email({ message: 'Email invalide' }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Le mot de passe actuel est requis' }),
  newPassword: z.string().min(6, { message: 'Le nouveau mot de passe doit comporter au moins 6 caractères' }),
});

export default function AdvancedSettingsPage() {
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', email: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/me');
        profileForm.reset({
          name: response.data.name,
          email: response.data.email,
        });
      } catch (error) {
        toast.error('Échec de la synchronisation du profil de sécurité');
        console.log(error);
      }
    };
    fetchUserData();
  }, [profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    const tid = toast.loading('Mise à jour de l\'identité...');
    try {
      await api.put('/admin/profile', values);
      toast.success('Identité mise à jour avec succès', { id: tid });
    } catch (error) {
      toast.error('Échec de la mise à jour du profil', { id: tid });
      console.log(error)
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    const tid = toast.loading('Chiffrement des nouvelles informations d\'identification...');
    try {
      await api.put('/admin/change-password', values);
      toast.success('Informations d\'identification mises à jour', { id: tid });
      passwordForm.reset();
    } catch (error) {
      toast.error('Échec de la mise à jour des informations d\'identification', { id: tid });
      console.log(error)
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1.2rem,2vw+1rem,2rem)] lg:p-[clamp(1.2rem,2vw+1rem,2rem)] space-y-[clamp(1.2rem,2vw+1rem,2rem)]">
      {/* Header Section */}
      <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Settings2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Configuration Système</span>
          </div>
          <h1 className="text-[clamp(1.1rem,2vw+1rem,2rem)] font-black text-slate-900 tracking-tighter  italic uppercase">
            Admin <span className="text-primary">Réglages.</span>
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Profile Settings */}
        <motion.div
          className="lg:col-span-7 space-y-[clamp(1.2rem,2vw+1rem,2rem)]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="space-y-1">
            <h2 className="text-[clamp(1.1rem,2vw+1rem,2rem)] font-black text-slate-900 italic tracking-tight uppercase flex items-center gap-3">
              <User className="text-primary" /> Profil d'identité
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informations publiques et identification du système</p>
          </div>

          <Card className="rounded-[clamp(1.2rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-2xl overflow-hidden bg-white">
            <CardContent className="p-10">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 gap-8">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nom Complet</FormLabel>
                          <div className="relative group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                            <FormControl>
                              <Input placeholder="John Doe" {...field} className="h-14 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600/20" />
                            </FormControl>
                          </div>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Professionnel</FormLabel>
                          <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                            <FormControl>
                              <Input placeholder="info@2cscomplexes.com" {...field} className="h-14 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600/20" />
                            </FormControl>
                          </div>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg transition-all w-full sm:w-auto">
                    <Save className="mr-2" size={18} /> Synchroniser le Profil
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Security & Alerts */}
        <motion.div
          className="lg:col-span-5 space-y-[clamp(1.2rem,2vw+1rem,2rem)]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="space-y-1">
            <h2 className="text-[clamp(1.2rem,2vw+1rem,2rem)] font-black text-slate-900 italic tracking-tight uppercase flex items-center gap-3">
              <ShieldCheck className="text-rose-600" /> Gestion des accès
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestion des informations d'identification et sécurité des sessions</p>
          </div>

          <Card className="rounded-[clamp(1.2rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-2xl overflow-hidden bg-white">
            <CardContent className="p-10">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mot de passe actuel</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <FormControl>
                            <Input type={showCurrentPwd ? "text" : "password"} {...field} className="h-14 pl-14 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700" />
                          </FormControl>
                          <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                            {showCurrentPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nouvelle Clé Sécurisée</FormLabel>
                        <div className="relative">
                          <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <FormControl>
                            <Input type={showNewPwd ? "text" : "password"} {...field} className="h-14 pl-14 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700" />
                          </FormControl>
                          <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                            {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <FormDescription className="text-[9px] font-bold uppercase text-slate-400 px-1">Min. 6 caractères alphanumériques</FormDescription>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-14 bg-rose-600 hover:bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-200 uppercase text-[10px] tracking-widest">
                    Mettre à jour les identifiants
                  </Button>
                </form>
              </Form>

              <Separator className="my-8 bg-slate-100" />

              <div className="p-6 bg-blue-50 rounded-[clamp(1.2rem,2vw+1rem,2rem)] flex items-center gap-4 border border-blue-100">
                <div className="bg-white p-3 rounded-[clamp(1.2rem,2vw+1rem,2rem)] shadow-sm">
                  <BellRing className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight italic">Relais de Notification</p>
                  <p className="text-[10px] text-primary font-bold opacity-80 mt-0.5">Alertes push pour les événements du système sont actives.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer System Status */}
      <footer className="max-w-5xl mx-auto flex items-center flex-wrap gap-3 justify-between px-6  max-md:pt-3 md:py-8 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <BadgeCheck className="text-emerald-500" size={20} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Sécurisée Vérifiée • 2026 2CS Registres</span>
        </div>
        <div className="flex gap-6">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">Politique de confidentialité</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">Journaux du système</span>
        </div>
      </footer>
    </div>
  );
}
