/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getUserRole } from '@/lib/auth';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const formSchema = z.object({
   email: z.string().email({ message: 'Veuillez entrer un email valide.' }),
   password: z.string().min(1, { message: 'Le mot de passe est requis' }),
});

export default function LoginPage() {
   const router = useRouter();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         email: '',
         password: '',
      },
   });

   const onSubmit = async (values: z.infer<typeof formSchema>) => {
      setIsLoading(true);
      try {
         const response = await api.post('/auth/local', { identifier: values.email, password: values.password }, { withCredentials: true });

         if (response.data?.jwt) {
            Cookies.set('accessToken', response.data.jwt, { expires: 1, path: '/' });
         }
         if (response.data?.user) {
            const returnedRole = response.data.user.schoolRole || response.data.user.role?.name || "STUDENT";
            Cookies.set('userRole', returnedRole, { expires: 1, path: '/' });
         }

         const role = getUserRole();
         if (!role) {
            throw new Error("Connexion réussie, mais aucun rôle utilisateur trouvé dans les cookies.");
         }

         toast.success('Connexion réussie', {
            description: `Bienvenue ! Redirection vers votre tableau de bord...`,
         });

         setTimeout(() => {
            switch (role) {
               case 'ADMIN':
                  router.push('/admin');
                  break;
               case 'ACCOUNTANT':
               case 'ACCOUNTLEAD':
                  router.push('/admin/finance');
                  break;
               case 'TEACHER':
                  router.push('/teacher');
                  break;
               case 'STUDENT':
                  router.push('/student');
                  break;
               case 'PARENT':
                  router.push('/parent');
                  break;
               case 'DRIVER':
                  router.push('/driver');
                  break;
               case 'WORKER':
                  router.push('/worker');
                  break;
               default:
                  router.push('/');
            }
         }, 1000);

      } catch (error: any) {
         const strapiError = error.response?.data?.error?.message || error.message;

         if (error instanceof AxiosError && (error.response?.status === 400 || error.response?.status === 401)) {
            toast.error('Échec de la connexion', {
               description: strapiError || 'Email ou mot de passe invalide. Veuillez réessayer.',
            });
         } else if (error instanceof AxiosError && error.response?.status === 403) {
            toast.error('Accès Interdit (403)', {
               description: strapiError || 'Votre compte est peut-être bloqué, non confirmé, ou la politique CORS du serveur a rejeté la demande.',
            });
         } else {
            console.error("Login failed:", error);
            toast.error('Erreur de connexion', {
               description: strapiError || 'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.',
            });
         }
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
         {/* Full Screen Background Image */}
         <div className="absolute inset-0 z-0">
            <Image
               src="/students.webp"
               alt="Background"
               fill
               className="object-cover"
               priority
               unoptimized
            />
            {/* Dark Overlay for better contrast */}
            <div className="absolute inset-0 bg-black/0 "></div>
         </div>

         {/* Centered Glassmorphism Card */}
         <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full max-w-lg z-10"
         >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl">
               
               <div className="text-center mb-10">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center overflow-hidden border border-white/30 bg-white/5 shadow-inner">
                     <Image src="/logo/2cslogo.jpeg" alt="Logo" width={80} height={80} className="object-cover" />
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Bienvenue</h2>
                  <p className="text-sm text-gray-300 mt-3 font-medium">Connectez-vous pour accéder à votre espace</p>
               </div>

               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel className="text-gray-200 font-medium ml-1">Adresse Email</FormLabel>
                              <FormControl>
                                 <Input 
                                    className="py-6 px-4 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 rounded-xl transition-all" 
                                    placeholder="votre.email@example.com" 
                                    {...field} 
                                 />
                              </FormControl>
                              <FormMessage className="text-red-300" />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                           <FormItem>
                              <div className="flex items-center justify-between ml-1">
                                 <FormLabel className="text-gray-200 font-medium">Mot de passe</FormLabel>
                              </div>
                              <FormControl>
                                 <Input 
                                    type="password" 
                                    className="py-6 px-4 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 rounded-xl transition-all" 
                                    placeholder="••••••••" 
                                    {...field} 
                                 />
                              </FormControl>
                              <FormMessage className="text-red-300" />
                           </FormItem>
                        )}
                     />
                     
                     <Button 
                        type="submit" 
                        className="w-full py-6 rounded-xl bg-[#394995] hover:bg-[#356ad0] text-white font-bold text-base mt-8 transition-all shadow-[0_0_20px_rgba(40,87,174,0.4)] hover:shadow-[0_0_30px_rgba(40,87,174,0.6)] cursor-pointer" 
                        disabled={isLoading}
                     >
                        {isLoading ? (
                           <div className="flex items-center gap-2">
                              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                              Connexion en cours...
                           </div>
                        ) : 'Se connecter'}
                     </Button>
                  </form>
               </Form>
            </div>
         </motion.div>
      </div>
   );
}
