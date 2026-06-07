'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download, FileSpreadsheet, RefreshCw, BarChart3, TrendingUp, Calendar, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import Papa from 'papaparse';

export default function FinancialReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<string>('MONTHLY');
  const [period, setPeriod] = useState<string>('2026-06');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/financial-reports?populate=*');
      setReports(res.data?.data || res.data || []);
    } catch (e: any) {
      toast.error('Échec du chargement de l\'historique des rapports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    const tid = toast.loading('Compilation des écritures du grand livre...');
    try {
      // Create new report entry in db
      const statsRes = await api.get('/school-finance/stats');
      const stats = statsRes.data;

      const reportNumber = `REP-${reportType.substring(0, 3)}-${Date.now().toString().slice(-4)}`;

      const newReport = {
        reportNumber,
        reportType,
        period,
        generatedDate: new Date().toISOString(),
        totalRevenue: stats.monthlyRevenue,
        totalExpenses: stats.salaryExpenses,
        netProfit: stats.monthlyRevenue - stats.salaryExpenses,
        outstandingDebt: stats.outstandingDebt,
        data: {
          tuition: stats.tuitionRevenue,
          transport: stats.transportationRevenue,
          payoutRatio: stats.paidStudents / stats.totalStudents
        }
      };

      await api.post('/financial-reports', { data: newReport });
      toast.success('Rapport compilé avec succès', { id: tid });
      fetchReports();
    } catch (e: any) {
      toast.error('La génération du rapport a échoué', { id: tid });
    }
  };

  const handleExportCSV = (report: any) => {
    const actual = report.attributes || report;
    const csvData = [
      { Metric: 'Report Number', Value: actual.reportNumber },
      { Metric: 'Report Type', Value: actual.reportType },
      { Metric: 'Period', Value: actual.period },
      { Metric: 'Generation Date', Value: new Date(actual.generatedDate).toLocaleString() },
      { Metric: 'Total Revenue (GNF)', Value: actual.totalRevenue },
      { Metric: 'Total Expenses (GNF)', Value: actual.totalExpenses },
      { Metric: 'Net Profit (GNF)', Value: actual.netProfit },
      { Metric: 'Outstanding Debt (GNF)', Value: actual.outstandingDebt }
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report-${actual.reportNumber}.csv`;
    a.click();
    toast.success('La feuille CSV a été exportée avec succès');
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Rapports financiers & Exportations</h1>
          <p className="text-sm text-slate-500 font-medium">Compiler les audits trimestriels/annuels des profits et pertes, les dettes impayées et l'analyse des revenus</p>
        </div>
      </div>

      {/* Compiler block */}
      <Card className="border-0 shadow-lg shadow-slate-100 bg-white rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-black uppercase text-slate-400">Type de catégorie de rapport</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Bilan Mensuel</SelectItem>
                <SelectItem value="YEARLY">Audit Annuel</SelectItem>
                <SelectItem value="REVENUE">Analyse des revenus</SelectItem>
                <SelectItem value="DEBT">Rapport sur les dettes impayées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-black uppercase text-slate-400">Intervalle de période</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                {['2026-06', '2026-07', '2026-08', '2026'].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateReport}
            className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Compiler le Nouveau Rapport
          </Button>
        </div>
      </Card>

      {/* Report list */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Historique des Déclarations</CardTitle>
          <button
            onClick={fetchReports}
            className="p-2 hover:bg-slate-50 border rounded-xl text-slate-400 hover:text-slate-600 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest animate-pulse">Synchronisation des archives...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro de rapport</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Revenu (GNF)</TableHead>
                  <TableHead>Dépenses (GNF)</TableHead>
                  <TableHead>Bénéfice Net (GNF)</TableHead>
                  <TableHead className="text-right">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report: any) => {
                  const actual = report.attributes || report;
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-bold text-slate-900">{actual.reportNumber}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-bold text-[10px]">{actual.reportType}</Badge></TableCell>
                      <TableCell className="font-semibold text-slate-600">{actual.period}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">{Number(actual.totalRevenue).toLocaleString()} GNF</TableCell>
                      <TableCell className="font-semibold text-rose-600">{Number(actual.totalExpenses).toLocaleString()} GNF</TableCell>
                      <TableCell className="font-black text-slate-900">{Number(actual.netProfit).toLocaleString()} GNF</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleExportCSV(report)}
                          size="sm"
                          variant="outline"
                          className="rounded-lg gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 border-emerald-100 hover:bg-emerald-50 duration-200"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
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
    </div>
  );
}
