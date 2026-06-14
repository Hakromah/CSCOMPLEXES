'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const profileFormSchema = z.object({
  name: z.string().min(1, { message: 'Nom est requis' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Mot de passe actuel est requis' }),
  newPassword: z.string().min(6, { message: 'Mot de passe doit contenir au moins 6 caracteres' }),
});

interface UserDTO {
  name: string;
  email: string;
}

export default function TeacherProfilePage() {
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get<UserDTO>('/auth/me');
        profileForm.reset({
          name: response.data.name,
          email: response.data.email,
        });
      } catch (error) {
        toast.error('Échec de la récupération des données utilisateur');
        console.log(error);
      }
    };
    fetchUserData();
  }, [profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      await api.put('/teacher/profile', values);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Échec de la mise à jour du profil');
      console.log(error);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    try {
      await api.put('/teacher/change-password', values);
      toast.success('Mot de passe modifié avec succès');
      passwordForm.reset();
    } catch (error) {
      toast.error('Échec de la modification du mot de passe');
      console.log(error);
    }
  };

  return (
    <div className="p-[clamp(1.2rem,2vw+1rem,2rem)] space-y-[clamp(1.2rem,2vw+1rem,2rem)]">
      <h1 className="text-[clamp(1.2rem,2vw+1rem,2rem)] font-bold"> Mon profil</h1>

      <Card className="border border-slate-200 md:hover:border-primary py-4 duration-500 transition-colors shadow-sm">
        <CardHeader>
          <CardTitle> Mise à jour du profil</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Mettre à jour le profil</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 py-4 md:hover:border-primary duration-500 transition-colors shadow-sm">
        <CardHeader>
          <CardTitle> Modification du mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Changer le mot de passe</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
