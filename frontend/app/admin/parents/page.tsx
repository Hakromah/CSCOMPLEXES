'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Trash2, Edit2, Search, Plus, X, Mail, Phone,
  MapPin, ShieldAlert, CheckCircle, Info, Landmark, Link, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ParentManagement() {
  const [parents, setParents] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    gender: 'Male',
    familyId: ''
  });

  const fetchParents = async () => {
    try {
      const res = await api.get('/admin/parents');
      setParents(res.data || []);
    } catch (err) {
      toast.error('Failed to load parent users ledger');
    }
  };

  const fetchFamilies = async () => {
    try {
      const res = await api.get('/admin/families');
      setFamilies(res.data || []);
    } catch (err) {
      console.error('Failed to fetch families', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchParents(), fetchFamilies()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      return toast.error('Username, Email, and Password are required');
    }

    try {
      const payload: any = { ...formData };
      if (payload.familyId) {
        payload.familyId = Number(payload.familyId);
      } else {
        delete payload.familyId;
      }

      await api.post('/admin/parents', payload);
      toast.success(`Parent account "${formData.username}" created successfully`);
      setIsCreateOpen(false);
      resetForm();
      fetchParents();
      fetchFamilies(); // Refresh family links
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to create parent user';
      toast.error(msg);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent) return;

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        gender: formData.gender
      };

      await api.put(`/admin/users/${selectedParent.id}`, payload);
      toast.success('Parent details updated successfully');
      setIsEditOpen(false);
      setSelectedParent(null);
      resetForm();
      fetchParents();
    } catch (err) {
      toast.error('Failed to update parent user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this parent account? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Parent user account deleted');
      fetchParents();
    } catch (err) {
      toast.error('Failed to delete parent account');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: '',
      gender: 'Male',
      familyId: ''
    });
  };

  const openEdit = (parent: any) => {
    setSelectedParent(parent);
    setFormData({
      username: parent.username || '',
      email: parent.email || '',
      password: '', // Password shouldn't be loaded
      firstName: parent.firstName || '',
      lastName: parent.lastName || '',
      phoneNumber: parent.phoneNumber || '',
      address: parent.address || '',
      gender: parent.gender || 'Male',
      familyId: '' // Family link is managed via families page
    });
    setIsEditOpen(true);
  };

  const filteredParents = parents.filter((p) =>
    (p.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.lastName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <UserCheck size={32} className="text-primary" />
            Parent Accounts Manager
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Provision guardian credentials, modify metadata, and verify family links
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-primary hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-sm flex items-center gap-2">
          <Plus size={18} />
          Add Parent User
        </Button>
      </header>

      {/* Main Table */}
      <Card className="rounded-3xl border border-transparent shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800">
            Guardian & Parent Accounts Registry
          </CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <Input
              placeholder="Search parent accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing parent data...</p>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No parent accounts found
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pl-6">Profile</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Authentication</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Contact</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Linked Families</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Gender</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParents.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <p className="font-bold text-slate-900">{p.firstName || ''} {p.lastName || ''}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{p.userId || 'No ID'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-slate-700">{p.username}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-slate-700 font-medium">{p.phoneNumber || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{p.address || 'No Address'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(p.familyMemberships || []).map((fam: any) => (
                          <Badge key={fam.id} className="bg-blue-50 text-primary border border-blue-100 text-[10px] font-medium">
                            {fam.familyName} ({fam.familyCode})
                          </Badge>
                        ))}
                        {(p.familyMemberships || []).length === 0 && (
                          <span className="text-xs text-slate-400 font-medium">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider ${p.gender === 'Female' ? 'text-pink-600 border-pink-100 bg-pink-50/50' : 'text-blue-600 border-blue-100 bg-blue-50/50'}`}>
                        {p.gender || 'Male'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="text-slate-500 hover:text-slate-900">
                          <Edit2 size={16} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              Create Parent guardian Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6 mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Username</label>
                <Input
                  required
                  placeholder="e.g. dialloparent"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Email Address</label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. parent@diallo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Temporary Password</label>
                <Input
                  required
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Gender</label>
                <Select onValueChange={(val) => setFormData({ ...formData, gender: val })} value={formData.gender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">First Name</label>
                <Input
                  placeholder="e.g. Mamadou"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Last Name</label>
                <Input
                  placeholder="e.g. Diallo"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Phone Number</label>
                <Input
                  placeholder="e.g. +224 600 00 00 00"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Home Address</label>
                <Input
                  placeholder="e.g. Dixinn, Conakry"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Assign to Family (Optional)</label>
                <Select onValueChange={(val) => setFormData({ ...formData, familyId: val })} value={formData.familyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a family to link" />
                  </SelectTrigger>
                  <SelectContent>
                    {families.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.familyName} ({f.familyCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700 text-white rounded-xl">Provision Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) { setIsEditOpen(false); setSelectedParent(null); resetForm(); } }}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              Edit Parent Account Details
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">First Name</label>
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Last Name</label>
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Phone Number</label>
              <Input
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Home Address</label>
              <Input
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Gender</label>
              <Select onValueChange={(val) => setFormData({ ...formData, gender: val })} value={formData.gender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => { setIsEditOpen(false); setSelectedParent(null); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700 text-white rounded-xl">Save Details</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
