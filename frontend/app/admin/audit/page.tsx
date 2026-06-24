'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Search, FileDown, ShieldAlert, CheckCircle, Info, Clock,
  User, Database, TableIcon, Calendar as CalendarIcon, ArrowLeftRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school-finance/audit-logs');
      // Sort logs by timestamp desc
      const sortedLogs = (res.data || []).sort((a: any, b: any) =>
        new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()
      );
      setLogs(sortedLogs);
    } catch (err) {
      toast.error('Failed to sync system audit ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCSV = () => {
    if (logs.length === 0) return toast.error('No audit logs to export');
    
    const headers = ['ID', 'Action Type', 'Entity Name', 'Entity ID', 'Performed By', 'Timestamp', 'Notes'];
    const rows = logs.map((log) => [
      log.id,
      log.actionType || '',
      log.entityName || '',
      log.entityId || '',
      log.performedBy?.username || log.performedBy?.name || 'System',
      new Date(log.timestamp || log.createdAt).toLocaleString(),
      log.notes || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AMFOFANA_System_Audit_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit trail exported successfully');
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.actionType || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.entityName || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.performedBy?.username || log.performedBy?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.notes || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === 'ALL' || log.actionType === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('PAID')) {
      return 'text-emerald-600 border-emerald-100 bg-emerald-50/50';
    }
    if (action.includes('UPDATE') || action.includes('SUBMIT')) {
      return 'text-amber-600 border-amber-100 bg-amber-50/50';
    }
    if (action.includes('DELETE') || action.includes('REJECT') || action.includes('ERROR')) {
      return 'text-red-600 border-red-100 bg-red-50/50';
    }
    return 'text-slate-600 border-slate-100 bg-slate-50/50';
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Activity size={32} className="text-primary" />
            System Audit Trail
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Monitor state transitions, financial transactions, and administrative changes
          </p>
        </div>
        <Button onClick={handleExportCSV} className="bg-primary hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-sm flex items-center gap-2">
          <FileDown size={18} />
          Export Ledger (CSV)
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl border border-transparent shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Total Logs Captured</h3>
            <p className="text-4xl font-black text-slate-900 mt-2">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-transparent shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Financial Mutations</h3>
            <p className="text-4xl font-black text-slate-900 mt-2">
              {logs.filter(l => (l.actionType || '').includes('INVOICE') || (l.actionType || '').includes('PAYMENT')).length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-transparent shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Errors / Rejections</h3>
            <p className="text-4xl font-black text-red-600 mt-2">
              {logs.filter(l => (l.actionType || '').includes('REJECT') || (l.actionType || '').includes('ERROR')).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="rounded-3xl border border-transparent shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800">
            Immutable Audit Trail Ledger
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Select onValueChange={setActionFilter} value={actionFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11 border-slate-200 rounded-xl">
                <SelectValue placeholder="Action Type Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="CREATE_INVOICE">Create Invoice</SelectItem>
                <SelectItem value="APPROVE_INVOICE">Approve Invoice</SelectItem>
                <SelectItem value="REJECT_INVOICE">Reject Invoice</SelectItem>
                <SelectItem value="CREATE_PAYMENT">Create Payment</SelectItem>
                <SelectItem value="APPROVE_PAYMENT">Approve Payment</SelectItem>
                <SelectItem value="REJECT_PAYMENT">Reject Payment</SelectItem>
                <SelectItem value="CREATE_SALARY_RECORD">Create Salary Record</SelectItem>
                <SelectItem value="APPROVE_SALARY_RECORD">Approve Salary Record</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <Input
                placeholder="Search audit trail..."
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
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving audit records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No audit logs captured in this range
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pl-6">Timestamp</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Action Type</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Entity Details</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Actor</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pr-6">Remarks / Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <span className="text-xs text-slate-600 font-bold flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider ${getActionBadgeColor(log.actionType || '')}`}>
                        {log.actionType || 'MUTATION'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-slate-700">{log.entityName || 'N/A'}</p>
                      <span className="text-[9px] font-bold uppercase text-slate-400">ID: {log.entityId || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
                        <User size={12} className="text-primary" />
                        {log.performedBy?.username || log.performedBy?.name || 'System / Auto'}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 py-4">
                      <span className="text-xs text-slate-500 font-medium">
                        {log.notes || 'No remarks logged'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
