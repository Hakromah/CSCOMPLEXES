'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Trash2, Edit2, Search, Plus, X, Link, Unlink,
  Home, ShieldAlert, CheckCircle, Info, Phone, MapPin, Globe, CreditCard
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

export default function FamilyManagement() {
  const [families, setFamilies] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [linkType, setLinkType] = useState<'PARENT' | 'STUDENT'>('PARENT');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    familyName: '',
    address: '',
    nationality: '',
    city: '',
    emergencyContact1Name: '',
    emergencyContact1Phone: '',
    emergencyContact1Relation: '',
    emergencyContact2Name: '',
    emergencyContact2Phone: '',
    emergencyContact2Relation: '',
    notes: '',
    isActive: true
  });

  const fetchFamilies = async () => {
    try {
      const res = await api.get('/admin/families');
      setFamilies(res.data || []);
    } catch (err) {
      toast.error('Failed to sync families registry');
    }
  };

  const fetchUsers = async () => {
    try {
      const [parentsRes, studentsRes] = await Promise.all([
        api.get('/admin/users?role=PARENT'),
        api.get('/admin/users?role=STUDENT')
      ]);
      setParents(parentsRes.data?.map((u: any) => ({ ...u, name: u.username || u.name })) || []);
      setStudents(studentsRes.data?.map((u: any) => ({ ...u, name: u.username || u.name })) || []);
    } catch (err) {
      console.error('Failed to fetch parents/students', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchFamilies(), fetchUsers()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.familyName) return toast.error('Family Name is required');

    try {
      const res = await api.post('/admin/families', formData);
      toast.success(`Family "${res.data.familyName}" created successfully`);
      setIsCreateOpen(false);
      resetForm();
      fetchFamilies();
    } catch (err) {
      toast.error('Failed to create family');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamily) return;

    try {
      const res = await api.put(`/admin/families/${selectedFamily.id}`, formData);
      toast.success(`Family "${res.data.familyName}" updated successfully`);
      setIsEditOpen(false);
      setSelectedFamily(null);
      resetForm();
      fetchFamilies();
    } catch (err) {
      toast.error('Failed to update family');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this family? All member assignments will be severed.')) return;
    try {
      await api.delete(`/admin/families/${id}`);
      toast.success('Family deleted successfully');
      fetchFamilies();
    } catch (err) {
      toast.error('Failed to delete family');
    }
  };

  const handleLinkUser = async () => {
    if (!selectedFamily || !selectedUserId) return toast.error('Please select a user');
    const endpoint = `/admin/families/${selectedFamily.id}/${linkType === 'PARENT' ? 'parents' : 'students'}`;
    
    try {
      await api.post(endpoint, { userId: Number(selectedUserId) });
      toast.success(`${linkType === 'PARENT' ? 'Parent' : 'Student'} linked successfully`);
      setIsLinkOpen(false);
      setSelectedUserId('');
      fetchFamilies();
    } catch (err) {
      toast.error('Linking member failed');
    }
  };

  const handleUnlinkUser = async (familyId: number, userId: number, type: 'parents' | 'students') => {
    if (!confirm('Remove member from this family?')) return;
    try {
      await api.delete(`/admin/families/${familyId}/${type}/${userId}`);
      toast.success('Member removed from family');
      fetchFamilies();
    } catch (err) {
      toast.error('Failed to unlink member');
    }
  };

  const resetForm = () => {
    setFormData({
      familyName: '',
      address: '',
      nationality: '',
      city: '',
      emergencyContact1Name: '',
      emergencyContact1Phone: '',
      emergencyContact1Relation: '',
      emergencyContact2Name: '',
      emergencyContact2Phone: '',
      emergencyContact2Relation: '',
      notes: '',
      isActive: true
    });
  };

  const openEdit = (family: any) => {
    setSelectedFamily(family);
    setFormData({
      familyName: family.familyName || '',
      address: family.address || '',
      nationality: family.nationality || '',
      city: family.city || '',
      emergencyContact1Name: family.emergencyContact1Name || '',
      emergencyContact1Phone: family.emergencyContact1Phone || '',
      emergencyContact1Relation: family.emergencyContact1Relation || '',
      emergencyContact2Name: family.emergencyContact2Name || '',
      emergencyContact2Phone: family.emergencyContact2Phone || '',
      emergencyContact2Relation: family.emergencyContact2Relation || '',
      notes: family.notes || '',
      isActive: family.isActive !== false
    });
    setIsEditOpen(true);
  };

  const openLink = (family: any, type: 'PARENT' | 'STUDENT') => {
    setSelectedFamily(family);
    setLinkType(type);
    setIsLinkOpen(true);
  };

  const filteredFamilies = families.filter((f) =>
    f.familyName?.toLowerCase().includes(search.toLowerCase()) ||
    f.familyCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Users size={32} className="text-primary" />
            Family Management
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Link parent accounts, monitor linked children, and manage demographics
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-primary hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-sm flex items-center gap-2">
          <Plus size={18} />
          Create Family
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl border border-transparent shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Total Families</h3>
            <p className="text-4xl font-black text-slate-900 mt-2">{families.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-transparent shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Linked Parents</h3>
            <p className="text-4xl font-black text-slate-900 mt-2">
              {families.reduce((acc, f) => acc + (f.parents?.length || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-transparent shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Linked Students</h3>
            <p className="text-4xl font-black text-slate-900 mt-2">
              {families.reduce((acc, f) => acc + (f.students?.length || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Registry */}
      <Card className="rounded-3xl border border-transparent shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800">
            Family Registry Ledgers
          </CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <Input
              placeholder="Search family name or code..."
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
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing registry data...</p>
            </div>
          ) : filteredFamilies.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No family records found
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pl-6">Family Info</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Demographics</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Parents</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Students</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Emergency Contacts</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFamilies.map((f) => (
                  <TableRow key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <p className="font-bold text-slate-900">{f.familyName}</p>
                      <Badge variant="outline" className="text-[10px] uppercase font-black tracking-wider text-primary border-blue-100 bg-blue-50/50 mt-1">
                        {f.familyCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-slate-600 font-medium">{f.city || 'N/A'}, {f.nationality || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{f.address || 'No Address'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        {(f.parents || []).map((p: any) => (
                          <div key={p.id} className="flex items-center gap-1.5">
                            <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-medium py-0.5 px-2 rounded">
                              {p.username || p.name}
                            </Badge>
                            <button onClick={() => handleUnlinkUser(f.id, p.id, 'parents')} className="text-red-400 hover:text-red-600">
                              <Unlink size={12} />
                            </button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => openLink(f, 'PARENT')} className="text-primary hover:text-blue-700 p-0 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mt-1">
                          <Link size={12} /> Link Parent
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        {(f.students || []).map((s: any) => (
                          <div key={s.id} className="flex items-center gap-1.5">
                            <Badge className="bg-blue-50 text-primary border border-blue-100 text-[10px] font-medium py-0.5 px-2 rounded">
                              {s.username || s.name}
                            </Badge>
                            <button onClick={() => handleUnlinkUser(f.id, s.id, 'students')} className="text-red-400 hover:text-red-600">
                              <Unlink size={12} />
                            </button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => openLink(f, 'STUDENT')} className="text-primary hover:text-blue-700 p-0 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mt-1">
                          <Link size={12} /> Link Student
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {f.emergencyContact1Name ? (
                        <div className="text-xs text-slate-600 font-medium">
                          <p>{f.emergencyContact1Name} ({f.emergencyContact1Relation})</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{f.emergencyContact1Phone}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">None</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(f)} className="text-slate-500 hover:text-slate-900">
                          <Edit2 size={16} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700">
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

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); setSelectedFamily(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              {isCreateOpen ? 'Create Family Record' : 'Edit Family Details'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isCreateOpen ? handleCreate : handleEdit} className="space-y-6 mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Family Surname / Name</label>
                <Input
                  required
                  placeholder="e.g. The Diallo Family"
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">City</label>
                <Input
                  placeholder="e.g. Conakry"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nationality</label>
                <Input
                  placeholder="e.g. Guinean"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Address</label>
                <Input
                  placeholder="e.g. Dixinn, Conakry"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-xs font-black uppercase text-primary tracking-wider">Primary Emergency Contact</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  placeholder="Full Name"
                  value={formData.emergencyContact1Name}
                  onChange={(e) => setFormData({ ...formData, emergencyContact1Name: e.target.value })}
                />
                <Input
                  placeholder="Phone Number"
                  value={formData.emergencyContact1Phone}
                  onChange={(e) => setFormData({ ...formData, emergencyContact1Phone: e.target.value })}
                />
                <Input
                  placeholder="Relationship (e.g. Uncle)"
                  value={formData.emergencyContact1Relation}
                  onChange={(e) => setFormData({ ...formData, emergencyContact1Relation: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-xs font-black uppercase text-primary tracking-wider">Secondary Emergency Contact</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  placeholder="Full Name"
                  value={formData.emergencyContact2Name}
                  onChange={(e) => setFormData({ ...formData, emergencyContact2Name: e.target.value })}
                />
                <Input
                  placeholder="Phone Number"
                  value={formData.emergencyContact2Phone}
                  onChange={(e) => setFormData({ ...formData, emergencyContact2Phone: e.target.value })}
                />
                <Input
                  placeholder="Relationship (e.g. Aunt)"
                  value={formData.emergencyContact2Relation}
                  onChange={(e) => setFormData({ ...formData, emergencyContact2Relation: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Internal Notes</label>
              <textarea
                rows={3}
                placeholder="Any special remarks or details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedFamily(null); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700 text-white rounded-xl">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Link className="text-primary" />
              Link Member to Family
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Select {linkType === 'PARENT' ? 'Parent' : 'Student'}</label>
              <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select a ${linkType === 'PARENT' ? 'parent' : 'student'}`} />
                </SelectTrigger>
                <SelectContent>
                  {(linkType === 'PARENT' ? parents : students).map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.email || u.userId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsLinkOpen(false)}>Cancel</Button>
              <Button onClick={handleLinkUser} className="bg-primary hover:bg-blue-700 text-white rounded-xl">Link Member</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
