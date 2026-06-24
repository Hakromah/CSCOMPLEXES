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
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters' }),
});

interface ParentProfileDTO {
  id: number;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  schoolRole: string;
}

export default function ParentProfilePage() {
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: '',
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
        const response = await api.get<ParentProfileDTO>('/parent/profile');
        profileForm.reset({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
        });
      } catch (error) {
        toast.error('Failed to fetch profile details');
        console.error(error);
      }
    };
    fetchUserData();
  }, [profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      await api.put('/parent/profile', values);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile details');
      console.error(error);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    try {
      await api.put('/parent/change-password', values);
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Failed to change password';
      toast.error(msg);
      console.error(error);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Settings</p>
        <h1 className="text-3xl font-black text-slate-900 mt-1">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-slate-200/60 rounded-3xl bg-white shadow-sm">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">Update Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500">First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First Name" className="h-11 rounded-xl bg-slate-50 border-slate-200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500">Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last Name" className="h-11 rounded-xl bg-slate-50 border-slate-200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={profileForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone Number" className="h-11 rounded-xl bg-slate-50 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Your physical address" className="h-11 rounded-xl bg-slate-50 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 font-black uppercase text-xs tracking-wider">
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 rounded-3xl bg-white shadow-sm">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">Change Account Password</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-11 rounded-xl bg-slate-50 border-slate-200" {...field} />
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
                      <FormLabel className="text-xs font-bold text-slate-500">New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-11 rounded-xl bg-slate-50 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 font-black uppercase text-xs tracking-wider">
                  Update Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
