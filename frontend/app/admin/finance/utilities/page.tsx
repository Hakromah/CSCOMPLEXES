'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RefreshCw, History, ShieldAlert, CheckCircle, Database, Eye, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AccountingUtilities() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  // Diff Dialog State
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school-finance/audit-logs');
      setLogs(res.data);
    } catch (e: any) {
      toast.error('Failed to sync immutable audit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    const tid = toast.loading('Running Recalculation Engine...');
    try {
      const res = await api.post('/school-finance/recalculate');
      toast.success(`Ledger repaired safely! Corrected ${res.data.correctedRecords} inconsistencies.`, { id: tid });
      fetchLogs();
    } catch (e: any) {
      toast.error('Recalculation engine encountered database error', { id: tid });
    } finally {
      setRecalculating(false);
    }
  };

  const handleOpenDiff = (log: any) => {
    setSelectedLog(log);
    setIsDiffOpen(true);
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">System Accounting Utilities</h1>
          <p className="text-sm text-slate-500 font-medium">Safe ledger auto-repair, analytics recalculation, and immutable audit trails</p>
        </div>
      </div>

      {/* Recalculate block */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg shadow-slate-100 bg-white rounded-3xl overflow-hidden md:col-span-2">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" /> Global Balance Recalculation
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Traverse student invoices, approved payment registries, and salary records to repair balance inconsistencies, refresh statistical totals, and sync debtor statuses.
              </p>
            </div>
            <Button 
              disabled={recalculating}
              onClick={handleRecalculate}
              className="h-12 px-6 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300 gap-2 w-full md:w-auto"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} /> 
              {recalculating ? 'Recomputing Ledger...' : 'Run Repair Engine'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-100 bg-white rounded-3xl p-6 flex flex-col justify-center">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-slate-400">Security Notice</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                All ledger modifications are immutably captured inside the audit log matrix. Approved invoices and salary logs cannot be modified without auto-repair triggers.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden mt-8">
        <CardHeader className="px-6 py-5 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" /> Ledger Immutable Audit Logs
          </CardTitle>
          <button 
            onClick={fetchLogs}
            className="p-2 hover:bg-slate-50 border rounded-xl text-slate-400 hover:text-slate-600 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest animate-pulse">Synchronizing Ledger Audits...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Inspection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => {
                  const actual = log.attributes || log;
                  const userName = actual.performedBy?.username || actual.performedBy?.name || 'System';
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 duration-200">
                      <TableCell className="text-xs text-slate-500 font-semibold">{new Date(actual.timestamp).toLocaleString()}</TableCell>
                      <TableCell><Badge className="font-extrabold text-[10px] bg-slate-900">{actual.actionType}</Badge></TableCell>
                      <TableCell className="font-bold text-slate-700">{actual.entityName} (id: {actual.entityId})</TableCell>
                      <TableCell className="font-semibold text-slate-600">{userName}</TableCell>
                      <TableCell className="text-slate-500 font-medium text-xs">{actual.notes || 'No notes added'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => handleOpenDiff(log)}
                          size="icon" 
                          variant="ghost"
                          className="rounded-xl hover:bg-slate-50"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diff Inspector Modal */}
      <Dialog open={isDiffOpen} onOpenChange={setIsDiffOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-md font-black uppercase tracking-wide flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" /> Diff Inspector: {selectedLog?.actionType} (ID: {selectedLog?.id})
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Previous Values</span>
                <pre className="p-4 bg-slate-50 border rounded-2xl max-h-[350px] overflow-y-auto text-[10px] text-slate-600 font-mono">
                  {selectedLog?.previousValues 
                    ? JSON.stringify(selectedLog.previousValues, null, 2) 
                    : 'NULL (Creation event)'}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400">New Values</span>
                <pre className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl max-h-[350px] overflow-y-auto text-[10px] text-emerald-800 font-mono">
                  {selectedLog?.newValues 
                    ? JSON.stringify(selectedLog.newValues, null, 2) 
                    : 'NULL (Deletion event)'}
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
