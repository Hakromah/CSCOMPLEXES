'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileWarning, Trash2, Edit2, Search, Plus, X, Award, AlertTriangle,
  FileText, ShieldCheck, Info, MapPin, User, Calendar as CalendarIcon, Send, CheckCircle
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

export default function BehaviorManagement() {
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    student: '',
    date: new Date().toISOString().split('T')[0],
    type: 'WARNING',
    title: '',
    description: '',
    severity: 'LOW',
    notifyParent: true,
    attachmentUrl: ''
  });

  const fetchRecords = async () => {
    try {
      const res = await api.get('/admin/behavior');
      setRecords(res.data || []);
    } catch (err) {
      toast.error('Failed to sync behavior records');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/users?role=STUDENT');
      setStudents(res.data?.map((u: any) => ({ ...u, name: u.username || u.name })) || []);
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRecords(), fetchStudents()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student || !formData.title || !formData.date) {
      return toast.error('Student, Title, and Date are required');
    }

    try {
      const payload = {
        ...formData,
        student: Number(formData.student)
      };

      await api.post('/admin/behavior', payload);
      toast.success('Behavior incident/achievement logged successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchRecords();
    } catch (err) {
      toast.error('Failed to log behavior record');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      const payload = {
        ...formData,
        student: Number(formData.student)
      };

      await api.put(`/admin/behavior/${selectedRecord.id}`, payload);
      toast.success('Behavior record updated successfully');
      setIsEditOpen(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (err) {
      toast.error('Failed to update behavior record');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this behavior record?')) return;
    try {
      await api.delete(`/admin/behavior/${id}`);
      toast.success('Behavior record deleted');
      fetchRecords();
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const resetForm = () => {
    setFormData({
      student: '',
      date: new Date().toISOString().split('T')[0],
      type: 'WARNING',
      title: '',
      description: '',
      severity: 'LOW',
      notifyParent: true,
      attachmentUrl: ''
    });
  };

  const openEdit = (rec: any) => {
    setSelectedRecord(rec);
    setFormData({
      student: String(rec.student?.id || ''),
      date: rec.date || new Date().toISOString().split('T')[0],
      type: rec.type || 'WARNING',
      title: rec.title || '',
      description: rec.description || '',
      severity: rec.severity || 'LOW',
      notifyParent: rec.notifyParent !== false,
      attachmentUrl: rec.attachmentUrl || ''
    });
    setIsEditOpen(true);
  };

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      (rec.student?.username || rec.student?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (rec.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (rec.recordedBy?.username || rec.recordedBy?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || rec.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'ACHIEVEMENT':
      case 'AWARD':
      case 'RECOGNITION':
        return 'text-emerald-600 border-emerald-100 bg-emerald-50/50';
      case 'WARNING':
        return 'text-amber-600 border-amber-100 bg-amber-50/50';
      case 'DISCIPLINE':
      case 'INCIDENT':
        return 'text-red-600 border-red-100 bg-red-50/50';
      default:
        return 'text-slate-500 border-slate-100 bg-slate-50/50';
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <FileWarning size={32} className="text-primary" />
            Behavior & Discipline Module
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Log student achievements, record disciplinary actions, and notify parents
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-primary hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-sm flex items-center gap-2">
          <Plus size={18} />
          Log Incident / Award
        </Button>
      </header>

      {/* Main Table */}
      <Card className="rounded-3xl border border-transparent shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800">
            Student Behavior Logs
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Select onValueChange={setTypeFilter} value={typeFilter}>
              <SelectTrigger className="w-full sm:w-44 h-11 border-slate-200 rounded-xl">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                <SelectItem value="AWARD">Award</SelectItem>
                <SelectItem value="RECOGNITION">Recognition</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="DISCIPLINE">Discipline</SelectItem>
                <SelectItem value="INCIDENT">Incident</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing behavior logs...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No behavior records logged
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pl-6">Student</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Date</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Record Details</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Type & Severity</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Recorded By</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <p className="font-bold text-slate-900">{rec.student?.username || rec.student?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{rec.student?.userId || 'No ID'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600 font-medium">
                        {new Date(rec.date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-slate-800">{rec.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm truncate">{rec.description || 'No description provided'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider ${getBadgeColor(rec.type)}`}>
                          {rec.type}
                        </Badge>
                        {['WARNING', 'DISCIPLINE', 'INCIDENT'].includes(rec.type) && (
                          <Badge variant="outline" className={`text-[9px] font-black uppercase py-0 ${rec.severity === 'HIGH' ? 'text-red-500 bg-red-50' : rec.severity === 'MEDIUM' ? 'text-amber-500 bg-amber-50' : 'text-slate-500 bg-slate-100'}`}>
                            {rec.severity} SEVERITY
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-slate-700 font-medium">{rec.recordedBy?.username || rec.recordedBy?.name || 'Admin'}</p>
                      {rec.parentNotified ? (
                        <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-0.5 mt-0.5">
                          <CheckCircle size={10} /> Parent Notified
                        </span>
                      ) : rec.notifyParent ? (
                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-0.5 mt-0.5">
                          <Info size={10} /> Pending Notify
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-0.5">Internal Log</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(rec)} className="text-slate-500 hover:text-slate-900">
                          <Edit2 size={16} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(rec.id)} className="text-red-500 hover:text-red-700">
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
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); setSelectedRecord(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              {isCreateOpen ? 'Log Behavior / Incident Details' : 'Modify Behavior Record'}
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
                        {s.name} ({s.userId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Date of Incident / Award</label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Record Type</label>
                <Select onValueChange={(val) => setFormData({ ...formData, type: val })} value={formData.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                    <SelectItem value="AWARD">Award</SelectItem>
                    <SelectItem value="RECOGNITION">Recognition</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="DISCIPLINE">Discipline</SelectItem>
                    <SelectItem value="INCIDENT">Incident</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Severity (For Disciplinary)</label>
                <Select onValueChange={(val) => setFormData({ ...formData, severity: val })} value={formData.severity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Title / Brief Description</label>
                <Input
                  required
                  placeholder="e.g. Outstanding Performance in Mathematics / Disruption in Class"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Detailed Description</label>
              <textarea
                rows={4}
                placeholder="Details of the event or incident..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyParent"
                checked={formData.notifyParent}
                onChange={(e) => setFormData({ ...formData, notifyParent: e.target.checked })}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="notifyParent" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer">
                Notify parent immediately via portal
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedRecord(null); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700 text-white rounded-xl">Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
