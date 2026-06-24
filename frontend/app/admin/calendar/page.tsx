'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Plus, Trash2, Edit2, Search, X, MapPin,
  Clock, Users, CheckCircle, Info, HelpCircle
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

export default function CalendarManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL_FILTERS');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ACADEMIC',
    startDate: '',
    endDate: '',
    location: '',
    targetAudience: 'ALL',
    targetClass: '',
    requiresConfirmation: false,
    isPublished: true
  });

  const fetchEvents = async () => {
    try {
      const res = await api.get('/admin/events');
      setEvents(res.data || []);
    } catch (err) {
      toast.error('Failed to load school events registry');
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/admin/classes');
      setClasses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchEvents(), fetchClasses()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.type) {
      return toast.error('Title, Start Date, and Event Type are required');
    }

    try {
      const payload = {
        ...formData,
        targetClass: formData.targetClass ? Number(formData.targetClass) : undefined
      };

      await api.post('/admin/events', payload);
      toast.success('School event registered and scheduled successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      toast.error('Failed to schedule event');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const payload = {
        ...formData,
        targetClass: formData.targetClass ? Number(formData.targetClass) : undefined
      };

      await api.put(`/admin/events/${selectedEvent.id}`, payload);
      toast.success('Event details modified successfully');
      setIsEditOpen(false);
      setSelectedEvent(null);
      resetForm();
      fetchEvents();
    } catch (err) {
      toast.error('Failed to update event');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this event from the calendar?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success('Event removed from scheduling');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to remove event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'ACADEMIC',
      startDate: '',
      endDate: '',
      location: '',
      targetAudience: 'ALL',
      targetClass: '',
      requiresConfirmation: false,
      isPublished: true
    });
  };

  const openEdit = (event: any) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      type: event.type || 'ACADEMIC',
      startDate: event.startDate ? event.startDate.substring(0, 16) : '',
      endDate: event.endDate ? event.endDate.substring(0, 16) : '',
      location: event.location || '',
      targetAudience: event.targetAudience || 'ALL',
      targetClass: String(event.targetClass?.id || ''),
      requiresConfirmation: event.requiresConfirmation !== false,
      isPublished: event.isPublished !== false
    });
    setIsEditOpen(true);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.location || '').toLowerCase().includes(search.toLowerCase());
    const matchesAudience = audienceFilter === 'ALL_FILTERS' || e.targetAudience === audienceFilter;
    return matchesSearch && matchesAudience;
  });

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'HOLIDAY':
        return 'text-red-600 border-red-100 bg-red-50/50';
      case 'EXAM':
        return 'text-amber-600 border-amber-100 bg-amber-50/50';
      case 'MEETING':
        return 'text-blue-600 border-blue-100 bg-blue-50/50';
      case 'SPORTS':
      case 'CULTURAL':
        return 'text-indigo-600 border-indigo-100 bg-indigo-50/50';
      default:
        return 'text-slate-600 border-slate-100 bg-slate-50/50';
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <CalendarIcon size={32} className="text-primary" />
            School Calendar Manager
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Plan activities, announce holidays, and schedule class meetings
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-primary hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-sm flex items-center gap-2">
          <Plus size={18} />
          Add Calendar Event
        </Button>
      </header>

      {/* Main Table */}
      <Card className="rounded-3xl border border-transparent shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800">
            Scheduled Events Directory
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Select onValueChange={setAudienceFilter} value={audienceFilter}>
              <SelectTrigger className="w-full sm:w-44 h-11 border-slate-200 rounded-xl">
                <SelectValue placeholder="Audience Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_FILTERS">All Audiences</SelectItem>
                <SelectItem value="ALL">All Portal Users</SelectItem>
                <SelectItem value="STUDENTS">Students Only</SelectItem>
                <SelectItem value="PARENTS">Parents Only</SelectItem>
                <SelectItem value="STAFF">Staff Only</SelectItem>
                <SelectItem value="CLASS">Specific Class</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <Input
                placeholder="Search events..."
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
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading school calendar...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No calendar events scheduled
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pl-6">Event Info</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Schedule</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Type & Audience</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Location</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Status</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((e) => (
                  <TableRow key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <p className="font-bold text-slate-900">{e.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm truncate">{e.description || 'No description'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-slate-700">Starts: {new Date(e.startDate).toLocaleString()}</p>
                        {e.endDate && (
                          <p className="text-slate-400 font-medium">Ends: {new Date(e.endDate).toLocaleString()}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider ${getBadgeColor(e.type)}`}>
                          {e.type}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 text-slate-500 bg-slate-100">
                          {e.targetAudience === 'CLASS' ? `Class: ${e.targetClass?.name || 'N/A'}` : `${e.targetAudience} AUDIENCE`}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                        <MapPin size={12} className="text-primary" />
                        {e.location || 'Online / Campus'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider ${e.isPublished ? 'text-emerald-600 border-emerald-100 bg-emerald-50/50' : 'text-slate-400 border-slate-100 bg-slate-50/50'}`}>
                          {e.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        {e.requiresConfirmation && (
                          <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-0.5">
                            <HelpCircle size={10} /> RSVP Required
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(e)} className="text-slate-500 hover:text-slate-900">
                          <Edit2 size={16} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700">
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
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); setSelectedEvent(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              {isCreateOpen ? 'Schedule School Event' : 'Modify Calendar Event'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isCreateOpen ? handleCreate : handleEdit} className="space-y-6 mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Event Title</label>
                <Input
                  required
                  placeholder="e.g. End of Term Parent-Teacher Association Meeting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Event Type</label>
                <Select onValueChange={(val) => setFormData({ ...formData, type: val })} value={formData.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACADEMIC">Academic</SelectItem>
                    <SelectItem value="EXAM">Exam Session</SelectItem>
                    <SelectItem value="HOLIDAY">School Holiday</SelectItem>
                    <SelectItem value="MEETING">PTA / Staff Meeting</SelectItem>
                    <SelectItem value="SPORTS">Sports Event</SelectItem>
                    <SelectItem value="CULTURAL">Cultural Event</SelectItem>
                    <SelectItem value="TRIP">Educational Trip</SelectItem>
                    <SelectItem value="OTHER">Other Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Event Location / Link</label>
                <Input
                  placeholder="e.g. Auditorium / Zoom Link"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">End Date & Time</label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Target Audience</label>
                <Select onValueChange={(val) => setFormData({ ...formData, targetAudience: val })} value={formData.targetAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Portal Users</SelectItem>
                    <SelectItem value="STUDENTS">Students Only</SelectItem>
                    <SelectItem value="PARENTS">Parents Only</SelectItem>
                    <SelectItem value="STAFF">Staff / Teachers Only</SelectItem>
                    <SelectItem value="CLASS">Specific Class Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.targetAudience === 'CLASS' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Class</label>
                  <Select onValueChange={(val) => setFormData({ ...formData, targetClass: val })} value={formData.targetClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Detailed Description</label>
              <textarea
                rows={3}
                placeholder="Details about the event, agenda, links, instructions..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isPublished" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer">
                  Publish to Calendar immediately
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresConfirmation"
                  checked={formData.requiresConfirmation}
                  onChange={(e) => setFormData({ ...formData, requiresConfirmation: e.target.checked })}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="requiresConfirmation" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer">
                  RSVP Required
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedEvent(null); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700 text-white rounded-xl">Schedule Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
