'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, UserPlus, Trash2, Edit2, Search, Plus, X, ShieldAlert,
  CheckCircle, Info, Landmark, Link, Clock, MapPin, DollarSign
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

export default function TransportManagement() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    student: '',
    driver: '',
    routeName: '',
    pickupPoint: '',
    dropoffPoint: '',
    pickupTime: '',
    dropoffTime: '',
    vehicleInfo: '',
    transportFee: '',
    isActive: true,
    notes: ''
  });

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/admin/transport');
      setAssignments(res.data || []);
    } catch (err) {
      toast.error('Failed to load transport assignments registry');
    }
  };

  const fetchUsers = async () => {
    try {
      const [studentsRes, driversRes] = await Promise.all([
        api.get('/admin/users?role=STUDENT'),
        api.get('/admin/users?role=DRIVER')
      ]);
      setStudents(studentsRes.data?.map((u: any) => ({ ...u, name: u.username || u.name })) || []);
      setDrivers(driversRes.data?.map((u: any) => ({ ...u, name: u.username || u.name })) || []);
    } catch (err) {
      console.error('Failed to fetch students/drivers', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAssignments(), fetchUsers()]);
      setLoading(false);
    };
    init();
  }, []);

  const formatTimeForStrapi = (timeStr: string) => {
    if (!timeStr || timeStr.trim() === '') return null;
    let cleaned = timeStr.trim();
    if (cleaned.toLowerCase().includes('am') || cleaned.toLowerCase().includes('pm')) {
      const isPM = cleaned.toLowerCase().includes('pm');
      const timeOnly = cleaned.replace(/(am|pm)/i, '').trim();
      const parts = timeOnly.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || '0', 10);
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000`;
    }
    const parts = cleaned.split(':');
    if (parts.length === 2) {
      return `${parts[0]}:${parts[1]}:00.000`;
    }
    if (parts.length === 3) {
      if (parts[2].includes('.')) return cleaned;
      return `${cleaned}.000`;
    }
    return cleaned;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student || !formData.routeName || !formData.pickupPoint || !formData.dropoffPoint) {
      return toast.error('Student, Route Name, Pickup, and Dropoff points are required');
    }

    try {
      const payload = {
        ...formData,
        student: Number(formData.student),
        driver: formData.driver ? Number(formData.driver) : null,
        transportFee: formData.transportFee ? Number(formData.transportFee) : 0,
        pickupTime: formatTimeForStrapi(formData.pickupTime),
        dropoffTime: formatTimeForStrapi(formData.dropoffTime)
      };

      await api.post('/admin/transport', payload);
      toast.success('Transport route assignment established successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchAssignments();
    } catch (err) {
      toast.error('Failed to assign transport route');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      const payload = {
        ...formData,
        student: Number(formData.student),
        driver: formData.driver ? Number(formData.driver) : null,
        transportFee: formData.transportFee ? Number(formData.transportFee) : 0,
        pickupTime: formatTimeForStrapi(formData.pickupTime),
        dropoffTime: formatTimeForStrapi(formData.dropoffTime)
      };

      await api.put(`/admin/transport/${selectedAssignment.id}`, payload);
      toast.success('Transport assignment updated successfully');
      setIsEditOpen(false);
      setSelectedAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (err) {
      toast.error('Failed to update transport route');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transport route assignment?')) return;
    try {
      await api.delete(`/admin/transport/${id}`);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (err) {
      toast.error('Failed to delete assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      student: '',
      driver: '',
      routeName: '',
      pickupPoint: '',
      dropoffPoint: '',
      pickupTime: '',
      dropoffTime: '',
      vehicleInfo: '',
      transportFee: '',
      isActive: true,
      notes: ''
    });
  };

  const openEdit = (ta: any) => {
    setSelectedAssignment(ta);
    setFormData({
      student: String(ta.student?.id || ''),
      driver: String(ta.driver?.id || ''),
      routeName: ta.routeName || '',
      pickupPoint: ta.pickupPoint || '',
      dropoffPoint: ta.dropoffPoint || '',
      pickupTime: ta.pickupTime ? ta.pickupTime.slice(0, 5) : '',
      dropoffTime: ta.dropoffTime ? ta.dropoffTime.slice(0, 5) : '',
      vehicleInfo: ta.vehicleInfo || '',
      transportFee: String(ta.transportFee || ''),
      isActive: ta.isActive !== false,
      notes: ta.notes || ''
    });
    setIsEditOpen(true);
  };

  const filteredAssignments = assignments.filter((ta) =>
    (ta.student?.username || ta.student?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (ta.routeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (ta.driver?.username || ta.driver?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Bus size={32} className="text-primary" />
            School Transport Assignments
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Map students to drivers, specify routes, and establish schedules
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-primary hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-sm flex items-center gap-2">
          <Plus size={18} />
          Assign Student Route
        </Button>
      </header>

      {/* Main Table */}
      <Card className="rounded-3xl border border-transparent shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800">
            Transport Assignment Directory
          </CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <Input
              placeholder="Search by student, route or driver..."
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
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing schedules...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No transport assignments found
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pl-6">Student</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Route Details</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Driver & Vehicle</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Pickup/Dropoff</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Fee</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Status</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((ta) => (
                  <TableRow key={ta.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <p className="font-bold text-slate-900">{ta.student?.username || ta.student?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{ta.student?.email || 'No email'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-slate-700">{ta.routeName}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-slate-700 font-medium">{ta.driver?.username || ta.driver?.name || 'Unassigned'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{ta.vehicleInfo || 'No vehicle info'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <p className="flex items-center gap-1 text-slate-600">
                          <MapPin size={12} className="text-emerald-500" />
                          <span>{ta.pickupPoint}</span>
                          <span className="text-slate-400 font-bold">({ta.pickupTime?.slice(0, 5) || 'N/A'})</span>
                        </p>
                        <p className="flex items-center gap-1 text-slate-600">
                          <MapPin size={12} className="text-red-500" />
                          <span>{ta.dropoffPoint}</span>
                          <span className="text-slate-400 font-bold">({ta.dropoffTime?.slice(0, 5) || 'N/A'})</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-black text-slate-950">
                        {ta.transportFee?.toLocaleString() || 0} GNF
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider ${ta.isActive ? 'text-emerald-600 border-emerald-100 bg-emerald-50/50' : 'text-slate-400 border-slate-100 bg-slate-50/50'}`}>
                        {ta.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(ta)} className="text-slate-500 hover:text-slate-900">
                          <Edit2 size={16} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(ta.id)} className="text-red-500 hover:text-red-700">
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

      {/* Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); setSelectedAssignment(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              {isCreateOpen ? 'Establish Transport Route' : 'Modify Transport Assignment'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isCreateOpen ? handleCreate : handleEdit} className="space-y-6 mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Student</label>
                <Select onValueChange={(val) => setFormData({ ...formData, student: val })} value={formData.student}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} ({s.email || s.userId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Assigned Driver</label>
                <Select onValueChange={(val) => setFormData({ ...formData, driver: val })} value={formData.driver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} ({d.phoneNumber || 'No phone'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Route Name / Code</label>
                <Input
                  required
                  placeholder="e.g. Route A - Dixinn"
                  value={formData.routeName}
                  onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Monthly Transport Fee (GNF)</label>
                <Input
                  type="number"
                  placeholder="e.g. 150000"
                  value={formData.transportFee}
                  onChange={(e) => setFormData({ ...formData, transportFee: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Pickup Point</label>
                <Input
                  required
                  placeholder="e.g. Dixinn Mosque"
                  value={formData.pickupPoint}
                  onChange={(e) => setFormData({ ...formData, pickupPoint: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Pickup Time</label>
                <Input
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Dropoff Point</label>
                <Input
                  required
                  placeholder="e.g. Dixinn Mosque"
                  value={formData.dropoffPoint}
                  onChange={(e) => setFormData({ ...formData, dropoffPoint: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Dropoff Time</label>
                <Input
                  type="time"
                  value={formData.dropoffTime}
                  onChange={(e) => setFormData({ ...formData, dropoffTime: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Vehicle Details</label>
                <Input
                  placeholder="e.g. Toyota Coaster (RC-1234-A) / Yellow Bus #3"
                  value={formData.vehicleInfo}
                  onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Special notes, medical issues, or parent requests..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer">
                Route assignment is active
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedAssignment(null); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700 text-white rounded-xl">Save Assignment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
