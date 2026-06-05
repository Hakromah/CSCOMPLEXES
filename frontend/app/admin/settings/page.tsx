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
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters' }),
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
        toast.error('Failed to sync security profile');
        console.log(error);
      }
    };
    fetchUserData();
  }, [profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    const tid = toast.loading('Updating identity...');
    try {
      await api.put('/admin/profile', values);
      toast.success('Identity updated successfully', { id: tid });
    } catch (error) {
      toast.error('Failed to update profile', { id: tid });
      console.log(error)
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    const tid = toast.loading('Encrypting new credentials...');
    try {
      await api.put('/admin/change-password', values);
      toast.success('Security credentials updated', { id: tid });
      passwordForm.reset();
    } catch (error) {
      toast.error('Credential update failed', { id: tid });
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
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">System Configuration</span>
          </div>
          <h1 className="text-[clamp(1.1rem,2vw+1rem,2rem)] font-black text-slate-900 tracking-tighter  italic uppercase">
            Admin <span className="text-primary">Settings.</span>
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
              <User className="text-primary" /> Identity Profile
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Public information and system identification</p>
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</FormLabel>
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Professional Email</FormLabel>
                          <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                            <FormControl>
                              <Input placeholder="admin@school.com" {...field} className="h-14 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600/20" />
                            </FormControl>
                          </div>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg transition-all w-full sm:w-auto">
                    <Save className="mr-2" size={18} /> Synchronize Profile
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
              <ShieldCheck className="text-rose-600" /> Access Guard
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Credential management and session security</p>
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</FormLabel>
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Secure Key</FormLabel>
                        <div className="relative">
                          <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <FormControl>
                            <Input type={showNewPwd ? "text" : "password"} {...field} className="h-14 pl-14 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700" />
                          </FormControl>
                          <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                            {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <FormDescription className="text-[9px] font-bold uppercase text-slate-400 px-1">Min. 6 alphanumeric characters</FormDescription>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-14 bg-rose-600 hover:bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-200 uppercase text-[10px] tracking-widest">
                    Update Credentials
                  </Button>
                </form>
              </Form>

              <Separator className="my-8 bg-slate-100" />

              <div className="p-6 bg-blue-50 rounded-[clamp(1.2rem,2vw+1rem,2rem)] flex items-center gap-4 border border-blue-100">
                <div className="bg-white p-3 rounded-[clamp(1.2rem,2vw+1rem,2rem)] shadow-sm">
                  <BellRing className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight italic">Notification Relay</p>
                  <p className="text-[10px] text-primary font-bold opacity-80 mt-0.5">Push alerts for system events are active.</p>
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
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Secure Session • 2026 AMF Registry</span>
        </div>
        <div className="flex gap-6">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">Privacy Policy</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">System Logs</span>
        </div>
      </footer>
    </div>
  );
}


// 'use client';

// import { useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Button } from '@/components/ui/button';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import { toast } from 'sonner';
// import api from '@/lib/api';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// const profileFormSchema = z.object({
//   name: z.string().min(1, { message: 'Name is required' }),
//   email: z.string().email({ message: 'Invalid email address' }),
// });

// const passwordFormSchema = z.object({
//   currentPassword: z.string().min(1, { message: 'Current password is required' }),
//   newPassword: z.string().min(6, { message: 'New password must be at least 6 characters' }),
// });

// interface UserDTO {
//   name: string;
//   email: string;
// }

// export default function SettingsPage() {
//   const profileForm = useForm<z.infer<typeof profileFormSchema>>({
//     resolver: zodResolver(profileFormSchema),
//     defaultValues: {
//       name: '', // Initialize with empty strings
//       email: '',
//     },
//   });

//   const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
//     resolver: zodResolver(passwordFormSchema),
//     defaultValues: {
//       currentPassword: '',
//       newPassword: '',
//     },
//   });

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const response = await api.get<UserDTO>('/auth/me');
//         profileForm.reset({
//           name: response.data.name,
//           email: response.data.email,
//         });
//       } catch (error) {
//         toast.error('Failed to fetch user data');
//         console.log(error);
//       }
//     };
//     fetchUserData();
//   }, [profileForm]);

//   const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
//     try {
//       await api.put('/admin/profile', values);
//       toast.success('Profile updated successfully');
//     } catch (error) {
//       toast.error('Failed to update profile');
//       console.log(error);
//     }
//   };

//   const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
//     try {
//       await api.put('/admin/change-password', values);
//       toast.success('Password changed successfully');
//       passwordForm.reset();
//     } catch (error) {
//       toast.error('Failed to change password');
//       console.log(error);
//     }
//   };

//   return (
//     <div className="p-8 space-y-8">
//       <h1 className="text-3xl font-bold">Settings</h1>

//       <Card>
//         <CardHeader>
//           <CardTitle>Update Profile</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Form {...profileForm}>
//             <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
//               <FormField
//                 control={profileForm.control}
//                 name="name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Name</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Your name" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={profileForm.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Your email" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <Button type="submit">Update Profile</Button>
//             </form>
//           </Form>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Change Password</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Form {...passwordForm}>
//             <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8">
//               <FormField
//                 control={passwordForm.control}
//                 name="currentPassword"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Current Password</FormLabel>
//                     <FormControl>
//                       <Input type="password" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={passwordForm.control}
//                 name="newPassword"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>New Password</FormLabel>
//                     <FormControl>
//                       <Input type="password" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <Button type="submit">Change Password</Button>
//             </form>
//           </Form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
