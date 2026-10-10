/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  GraduationCap, Calendar, Clock, Layers, Award, RefreshCw, Plus, Trash2,
  Edit2, CheckCircle2, AlertCircle, BookOpen, Sparkles,
  Search, Check, ChevronDown, ChevronRight,
  Calculator, School, Info
} from 'lucide-react';

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface AcademicYear {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  semesters?: any[];
  classes?: any[];
}

interface Period {
  id: number;
  name: string;
  periodType: 'SEMESTER' | 'TERM' | 'QUARTER' | 'MODULE';
  order: number;
  startDate?: string;
  endDate?: string;
  academicYear?: { id: number; name: string };
}

interface AssessmentCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

interface CategoryWeight {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  weight: number;
  maxScore: number;
}

interface AssessmentBlueprint {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  totalWeightTarget: number;
  categoryWeights: CategoryWeight[];
  academicYear?: AcademicYear;
  semester?: Period;
  classe?: { id: number; name: string };
  gradingScheme?: GradingScheme;
}

interface GradeTier {
  min: number;
  max: number;
  letter: string;
  point: number;
  remark: string;
}

interface GradingScheme {
  id: number;
  name: string;
  isDefault: boolean;
  passingScore: number;
  grades: GradeTier[];
}

interface SchoolClass {
  id: number;
  name: string;
  grade?: string;
  academicYear?: AcademicYear;
}

interface StudentUser {
  id: number;
  userId?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// ─── Guinean Standard 20-point Scale Defaults ─────────────────────────────────
const DEFAULT_GUINEA_GRADES: GradeTier[] = [
  { min: 18.0, max: 20.0, letter: 'A+', point: 4.0, remark: 'Excellent (Félicitations)' },
  { min: 16.0, max: 17.99, letter: 'A', point: 3.7, remark: 'Très Bien (Tableau d\'Honneur)' },
  { min: 14.0, max: 15.99, letter: 'B+', point: 3.3, remark: 'Bien (Encouragements)' },
  { min: 12.0, max: 13.99, letter: 'B', point: 3.0, remark: 'Assez Bien' },
  { min: 10.0, max: 11.99, letter: 'C', point: 2.0, remark: 'Passable (Admis)' },
  { min: 8.0, max: 9.99, letter: 'D', point: 1.0, remark: 'Insuffisant (Rattrapage)' },
  { min: 0.0, max: 7.99, letter: 'F', point: 0.0, remark: 'Échec (Non admis)' },
];

const STANDARD_CATEGORY_PRESETS = [
  { name: 'Contrôles Continus & Devoirs', code: 'QUIZ', description: 'Évaluations régulières, devoirs sur table et interrogations écrites' },
  { name: 'Examen de Synthèse / Partiel', code: 'EXAM', description: 'Examens de fin de trimestre/semestre ou épreuves standardisées' },
  { name: 'Travaux Pratiques & Projets', code: 'PROJECT', description: 'Travaux dirigés, travaux pratiques, exposés et projets scolaires' },
  { name: 'Assiduité & Participation', code: 'PART', description: 'Engagement oral, travail personnel et discipline en classe' },
];

// Universal normalizing helper that handles:
// 1. Direct array of objects (Strapi entityService response / Custom endpoint)
// 2. Strapi REST envelope: { data: [ ... ] }
// 3. Strapi v4/v5 format with { id, attributes: { ... } }
function normalizeArray<T = any>(data: any): T[] {
  if (!data) return [];
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return list.map((item: any) => {
    if (!item || typeof item !== 'object') return item;
    if (item.attributes) {
      const attrs = { ...item.attributes };
      for (const [key, val] of Object.entries(attrs)) {
        if (val && typeof val === 'object' && 'data' in (val as any)) {
          const raw = (val as any).data;
          if (Array.isArray(raw)) {
            attrs[key] = normalizeArray(raw);
          } else if (raw && typeof raw === 'object') {
            attrs[key] = raw.attributes ? { id: raw.id, ...raw.attributes } : raw;
          }
        }
      }
      return { id: item.id, documentId: item.documentId, ...attrs };
    }
    return item;
  });
}

// ─── Dual-Layer Robust API Fetchers with Fallbacks ─────────────────────────────
async function fetchAcademicYearsRobust(): Promise<AcademicYear[]> {
  try {
    const res = await api.get('/admin/academic-years');
    const data = normalizeArray<AcademicYear>(res.data);
    if (data.length > 0) return data;
  } catch {
    // fallback
  }
  try {
    const res = await api.get('/academic-years?pagination[pageSize]=100&populate=*');
    return normalizeArray<AcademicYear>(res.data);
  } catch {
    return [];
  }
}

async function fetchPeriodsRobust(yearId?: string): Promise<Period[]> {
  try {
    const query = yearId ? `?academicYearId=${yearId}` : '';
    const res = await api.get(`/admin/academic-periods${query}`);
    const data = normalizeArray<Period>(res.data);
    if (data.length > 0) return data;
  } catch {
    // fallback
  }
  try {
    const filter = yearId ? `&filters[academicYear][id]=${yearId}` : '';
    const res = await api.get(`/semesters?pagination[pageSize]=100&populate=*${filter}`);
    return normalizeArray<Period>(res.data);
  } catch {
    return [];
  }
}

async function fetchCategoriesRobust(): Promise<AssessmentCategory[]> {
  try {
    const res = await api.get('/admin/assessment-categories');
    const data = normalizeArray<AssessmentCategory>(res.data);
    if (data.length > 0) return data;
  } catch {
    // fallback
  }
  try {
    const res = await api.get('/assessment-categories?pagination[pageSize]=100');
    return normalizeArray<AssessmentCategory>(res.data);
  } catch {
    return [];
  }
}

async function fetchBlueprintsRobust(yearId?: string): Promise<AssessmentBlueprint[]> {
  try {
    const query = yearId ? `?academicYearId=${yearId}` : '';
    const res = await api.get(`/admin/assessment-blueprints${query}`);
    const data = normalizeArray<AssessmentBlueprint>(res.data);
    if (data.length > 0) return data;
  } catch {
    // fallback
  }
  try {
    const filter = yearId ? `&filters[academicYear][id]=${yearId}` : '';
    const res = await api.get(`/assessment-blueprints?pagination[pageSize]=100&populate=*${filter}`);
    return normalizeArray<AssessmentBlueprint>(res.data);
  } catch {
    return [];
  }
}

async function fetchGradingSchemesRobust(): Promise<GradingScheme[]> {
  try {
    const res = await api.get('/admin/grading-schemes');
    const data = normalizeArray<GradingScheme>(res.data);
    if (data.length > 0) return data;
  } catch {
    // fallback
  }
  try {
    const res = await api.get('/grading-schemes?pagination[pageSize]=100');
    return normalizeArray<GradingScheme>(res.data);
  } catch {
    return [];
  }
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AcademicManagementPage() {
  const [activeTab, setActiveTab] = useState<'years' | 'periods' | 'categories' | 'blueprints' | 'schemes' | 'recalculate'>('years');
  const [loading, setLoading] = useState(false);

  // Global Datasets
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [blueprints, setBlueprints] = useState<AssessmentBlueprint[]>([]);
  const [gradingSchemes, setGradingSchemes] = useState<GradingScheme[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);

  // ─── Fetch All Data ─────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedYears, loadedCats, loadedSchemes, classesRes, studentsRes] = await Promise.all([
        fetchAcademicYearsRobust(),
        fetchCategoriesRobust(),
        fetchGradingSchemesRobust(),
        api.get('/admin/classes').catch(() => api.get('/school-classes?pagination[pageSize]=100').catch(() => ({ data: [] }))),
        api.get('/admin/users?role=STUDENT').catch(() => ({ data: [] })),
      ]);

      setAcademicYears(loadedYears);
      setCategories(loadedCats);
      setGradingSchemes(loadedSchemes);
      setClasses(normalizeArray<SchoolClass>(classesRes.data));
      setStudents(normalizeArray<StudentUser>(studentsRes.data));

      // Select active or first year by default
      if (loadedYears.length > 0) {
        const currentYear = loadedYears.find(y => y.isCurrent) || loadedYears[0];
        setSelectedYearId(prev => (prev && loadedYears.some(y => String(y.id) === prev) ? prev : String(currentYear.id)));
      }
    } catch (err: any) {
      console.error('Error fetching academic data:', err);
      toast.error('Erreur lors du chargement des données académiques');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch Periods & Blueprints for selected year ───────────────────────────
  const fetchScopedData = useCallback(async (yearId: string) => {
    if (!yearId) return;
    try {
      const [loadedPeriods, loadedBlueprints] = await Promise.all([
        fetchPeriodsRobust(yearId),
        fetchBlueprintsRobust(yearId),
      ]);
      setPeriods(loadedPeriods);
      setBlueprints(loadedBlueprints);
    } catch (err) {
      console.error('Error fetching scoped academic data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (selectedYearId) {
      fetchScopedData(selectedYearId);
    }
  }, [selectedYearId, fetchScopedData]);

  // Active year reference
  const currentAcademicYear = useMemo(() => {
    return academicYears.find(y => String(y.id) === selectedYearId) || academicYears.find(y => y.isCurrent);
  }, [academicYears, selectedYearId]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Header & Overview ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Configuration & Gestion Académique
                </h1>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                  Système National Guinéen (sur 20)
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Pilotez les années scolaires, périodes, catégories de notation, grilles de pondération et barèmes sur 20.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Année active:</span>
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="h-8 border-none bg-transparent font-semibold text-slate-900 dark:text-white focus:ring-0 w-36">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.name} {y.isCurrent && '★'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchAllData(); if (selectedYearId) fetchScopedData(selectedYearId); }}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Années Scolaires</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {academicYears.length}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              {currentAcademicYear ? `En cours: ${currentAcademicYear.name}` : 'Aucune active'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Périodes / Semestres</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {periods.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pour l&apos;année sélectionnée</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Catégories d&apos;Éval.</span>
              <BookOpen className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {categories.filter(c => c.isActive !== false).length}
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">Actives</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Grilles de Pondération</span>
              <Layers className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {blueprints.length}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Blueprints actifs</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Barèmes de Notation</span>
              <Award className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {gradingSchemes.length || 1}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Barème National /20</div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-900/80 rounded-2xl overflow-x-auto border border-slate-200 dark:border-slate-800">
        {[
          { id: 'years', label: 'Années Scolaires', icon: Calendar, count: academicYears.length },
          { id: 'periods', label: 'Périodes & Semestres', icon: Clock, count: periods.length },
          { id: 'categories', label: "Catégories d'Évaluation", icon: BookOpen, count: categories.length },
          { id: 'blueprints', label: 'Grilles de Pondération', icon: Layers, count: blueprints.length },
          { id: 'schemes', label: 'Barèmes de Notation (/20)', icon: Award, count: gradingSchemes.length },
          { id: 'recalculate', label: 'Recalcul & Synchronisation', icon: Calculator, highlight: true },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content Views ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'years' && (
            <AcademicYearsTab
              academicYears={academicYears}
              onRefresh={fetchAllData}
              onSelectYear={setSelectedYearId}
              selectedYearId={selectedYearId}
            />
          )}

          {activeTab === 'periods' && (
            <AcademicPeriodsTab
              academicYears={academicYears}
              selectedYearId={selectedYearId}
              onSelectYear={setSelectedYearId}
              periods={periods}
              onRefresh={() => fetchScopedData(selectedYearId)}
            />
          )}

          {activeTab === 'categories' && (
            <AssessmentCategoriesTab
              categories={categories}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'blueprints' && (
            <AssessmentBlueprintsTab
              academicYears={academicYears}
              selectedYearId={selectedYearId}
              periods={periods}
              classes={classes}
              categories={categories}
              gradingSchemes={gradingSchemes}
              blueprints={blueprints}
              onRefresh={() => fetchScopedData(selectedYearId)}
            />
          )}

          {activeTab === 'schemes' && (
            <GradingSchemesTab
              schemes={gradingSchemes}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'recalculate' && (
            <RecalculationTab
              academicYears={academicYears}
              selectedYearId={selectedYearId}
              classes={classes}
              students={students}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// 1. ACADEMIC YEARS TAB
// ═════════════════════════════════════════════════════════════════════════════════
function AcademicYearsTab({
  academicYears,
  onRefresh,
  onSelectYear,
  selectedYearId
}: {
  academicYears: AcademicYear[];
  onRefresh: () => void;
  onSelectYear: (id: string) => void;
  selectedYearId: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);

  const openCreate = () => {
    setEditingYear(null);
    setName('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(academicYears.length === 0);
    setDialogOpen(true);
  };

  const openEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setName(year.name);
    setStartDate(year.startDate || '');
    setEndDate(year.endDate || '');
    setIsCurrent(Boolean(year.isCurrent));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Veuillez saisir le nom de l'année scolaire");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        isCurrent,
      };

      if (editingYear) {
        try {
          await api.put(`/admin/academic-years/${editingYear.id}`, payload);
        } catch {
          await api.put(`/academic-years/${editingYear.id}`, { data: payload });
        }
        toast.success("Année scolaire mise à jour avec succès");
      } else {
        let createdId: number | null = null;
        try {
          const res = await api.post('/admin/academic-years', payload);
          createdId = res.data?.id;
        } catch {
          const res2 = await api.post('/academic-years', { data: payload });
          createdId = res2.data?.data?.id || res2.data?.id;
        }
        toast.success("Année scolaire créée avec succès");
        if (createdId) onSelectYear(String(createdId));
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (year: AcademicYear) => {
    if (!confirm(`Supprimer l'année scolaire "${year.name}" ? Toutes les données associées peuvent être impactées.`)) return;
    try {
      try {
        await api.delete(`/admin/academic-years/${year.id}`);
      } catch {
        await api.delete(`/academic-years/${year.id}`);
      }
      toast.success("Année scolaire supprimée");
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur de suppression");
    }
  };

  const filtered = academicYears.filter(y =>
    (y.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher une année scolaire (ex: 2025-2026)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Nouvelle Année Scolaire
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(year => {
          const isSelected = String(year.id) === selectedYearId;
          return (
            <Card
              key={year.id}
              className={`relative overflow-hidden transition-all duration-200 border-2 ${
                year.isCurrent
                  ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : isSelected
                  ? 'border-blue-500/80 bg-blue-50/20 dark:bg-blue-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {year.isCurrent && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-bl-lg shadow-sm">
                  En Cours
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {year.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {year.startDate && year.endDate
                        ? `${new Date(year.startDate).toLocaleDateString('fr-FR')} → ${new Date(year.endDate).toLocaleDateString('fr-FR')}`
                        : 'Dates non spécifiées'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{year.semesters?.length || 0} Périodes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-blue-500" />
                    <span>{year.classes?.length || 0} Classes</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onSelectYear(String(year.id))}
                    className="text-xs h-8"
                  >
                    {isSelected ? "Sélectionnée" : "Gérer cette année"}
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(year)} className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(year)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Aucune année scolaire trouvée</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Créez votre première année académique pour commencer à configurer les périodes et les grilles.
            </p>
            <Button onClick={openCreate} size="sm" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Créer une année scolaire
            </Button>
          </div>
        )}
      </div>

      {/* Year Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingYear ? "Modifier l'Année Scolaire" : "Nouvelle Année Scolaire"}</DialogTitle>
            <DialogDescription>
              Définissez la plage temporelle et le statut de cette année scolaire.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom de l&apos;année scolaire <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ex: 2025-2026 ou 2026-2027"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="isCurrentYear"
                checked={isCurrent}
                onChange={e => setIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isCurrentYear" className="cursor-pointer text-xs leading-relaxed">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Définir comme année scolaire en cours</span>
                <span className="text-slate-500">Cette année sera sélectionnée par défaut sur l&apos;ensemble du portail.</span>
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? 'Enregistrement...' : editingYear ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// 2. ACADEMIC PERIODS TAB
// ═════════════════════════════════════════════════════════════════════════════════
function AcademicPeriodsTab({
  academicYears,
  selectedYearId,
  onSelectYear,
  periods,
  onRefresh
}: {
  academicYears: AcademicYear[];
  selectedYearId: string;
  onSelectYear: (id: string) => void;
  periods: Period[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [yearId, setYearId] = useState(selectedYearId);
  const [name, setName] = useState('');
  const [periodType, setPeriodType] = useState<'SEMESTER' | 'TERM' | 'QUARTER' | 'MODULE'>('SEMESTER');
  const [order, setOrder] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setYearId(selectedYearId);
  }, [selectedYearId]);

  const openCreate = () => {
    setEditingPeriod(null);
    setName(`Semestre ${periods.length + 1}`);
    setPeriodType('SEMESTER');
    setOrder(String(periods.length + 1));
    setStartDate('');
    setEndDate('');
    setDialogOpen(true);
  };

  const openEdit = (period: Period) => {
    setEditingPeriod(period);
    setYearId(String(period.academicYear?.id || selectedYearId));
    setName(period.name);
    setPeriodType(period.periodType || 'SEMESTER');
    setOrder(String(period.order || 1));
    setStartDate(period.startDate || '');
    setEndDate(period.endDate || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !yearId) {
      toast.error("Veuillez renseigner le nom et l'année scolaire");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        periodType,
        order: Number(order) || 1,
        startDate: startDate || null,
        endDate: endDate || null,
        academicYear: Number(yearId),
      };

      if (editingPeriod) {
        try {
          await api.put(`/admin/academic-periods/${editingPeriod.id}`, payload);
        } catch {
          await api.put(`/semesters/${editingPeriod.id}`, { data: payload });
        }
        toast.success("Période académique mise à jour");
      } else {
        try {
          await api.post('/admin/academic-periods', payload);
        } catch {
          await api.post('/semesters', { data: payload });
        }
        toast.success("Période académique créée");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (period: Period) => {
    if (!confirm(`Supprimer la période "${period.name}" ?`)) return;
    try {
      try {
        await api.delete(`/admin/academic-periods/${period.id}`);
      } catch {
        await api.delete(`/semesters/${period.id}`);
      }
      toast.success("Période supprimée");
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur de suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrer par année:</Label>
          <Select value={selectedYearId} onValueChange={onSelectYear}>
            <SelectTrigger className="w-52 h-9">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map(y => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.name} {y.isCurrent && '★'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Ajouter une Période / Semestre
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {periods.sort((a, b) => a.order - b.order).map(period => (
          <Card key={period.id} className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      {period.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      Ordre #{period.order}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-xs">
                      {period.periodType === 'SEMESTER' ? 'Semestre' : period.periodType === 'TERM' ? 'Trimestre' : period.periodType === 'QUARTER' ? 'Quart' : 'Module'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {period.academicYear?.name || 'Année active'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(period)} className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(period)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {period.startDate && period.endDate
                    ? `${new Date(period.startDate).toLocaleDateString('fr-FR')} → ${new Date(period.endDate).toLocaleDateString('fr-FR')}`
                    : 'Dates de période non définies'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {periods.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Aucune période pour cette année</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Configurez les semestres ou trimestres scolaires (ex: Semestre 1, Semestre 2) pour organiser les évaluations.
            </p>
            <Button onClick={openCreate} size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Créer un semestre
            </Button>
          </div>
        )}
      </div>

      {/* Period Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPeriod ? "Modifier la Période" : "Ajouter une Période Académique"}</DialogTitle>
            <DialogDescription>
              Configurez le nom, type et la chronologie de cette période scolaire.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Année scolaire associée <span className="text-red-500">*</span></Label>
              <Select value={yearId} onValueChange={setYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une année..." />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom de la période <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ex: Semestre 1"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ordre de passage</Label>
                <Input
                  type="number"
                  min="1"
                  value={order}
                  onChange={e => setOrder(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Type de période</Label>
              <Select value={periodType} onValueChange={(v: any) => setPeriodType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMESTER">Semestre (Semestriel)</SelectItem>
                  <SelectItem value="TERM">Trimestre (Trimestriel)</SelectItem>
                  <SelectItem value="QUARTER">Quart / Période</SelectItem>
                  <SelectItem value="MODULE">Module Thématique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving ? 'Enregistrement...' : editingPeriod ? 'Mettre à jour' : 'Créer la période'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// 3. ASSESSMENT CATEGORIES TAB
// ═════════════════════════════════════════════════════════════════════════════════
function AssessmentCategoriesTab({
  categories,
  onRefresh
}: {
  categories: AssessmentCategory[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<AssessmentCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openCreate = () => {
    setEditingCat(null);
    setName('');
    setCode('');
    setDescription('');
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (cat: AssessmentCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setCode(cat.code);
    setDescription(cat.description || '');
    setIsActive(cat.isActive !== false);
    setDialogOpen(true);
  };

  const handleInitPresets = async () => {
    if (!confirm("Initialiser les catégories de notation standards nationales (Contrôles, Examens, TP, Participation) ?")) return;
    try {
      for (const p of STANDARD_CATEGORY_PRESETS) {
        const exists = categories.some(c => c.code.toUpperCase() === p.code.toUpperCase());
        if (!exists) {
          try {
            await api.post('/admin/assessment-categories', {
              name: p.name,
              code: p.code,
              description: p.description,
              isActive: true,
            });
          } catch {
            await api.post('/assessment-categories', {
              data: {
                name: p.name,
                code: p.code,
                description: p.description,
                isActive: true,
              }
            });
          }
        }
      }
      toast.success("Catégories nationales initialisées avec succès");
      onRefresh();
    } catch (err: any) {
      toast.error("Erreur lors de l'initialisation des catégories");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Le nom et le code court sont obligatoires");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        isActive,
      };

      if (editingCat) {
        try {
          await api.put(`/admin/assessment-categories/${editingCat.id}`, payload);
        } catch {
          await api.put(`/assessment-categories/${editingCat.id}`, { data: payload });
        }
        toast.success("Catégorie d'évaluation mise à jour");
      } else {
        try {
          await api.post('/admin/assessment-categories', payload);
        } catch {
          await api.post('/assessment-categories', { data: payload });
        }
        toast.success("Catégorie d'évaluation créée");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: AssessmentCategory) => {
    if (!confirm(`Supprimer la catégorie "${cat.name}" (${cat.code}) ?`)) return;
    try {
      try {
        await api.delete(`/admin/assessment-categories/${cat.id}`);
      } catch {
        await api.delete(`/assessment-categories/${cat.id}`);
      }
      toast.success("Catégorie supprimée");
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur de suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Typologie des Évaluations & Devoirs
          </h2>
          <p className="text-xs text-slate-500">
            Définit les natures d&apos;épreuves pédagogiques utilisées pour construire les coefficients et grilles de notation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {categories.length < 3 && (
            <Button variant="outline" size="sm" onClick={handleInitPresets} className="text-xs gap-1.5 border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
              <Sparkles className="w-3.5 h-3.5" />
              Initialiser Modèles Standards
            </Button>
          )}
          <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Nouvelle Catégorie
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <Card key={cat.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 font-mono text-xs px-2 py-0.5">
                    {cat.code}
                  </Badge>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                    {cat.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(cat)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p className="line-clamp-2 min-h-[32px]">
                {cat.description || "Aucune description renseignée."}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Statut:</span>
                <span className={`inline-flex items-center gap-1 font-medium ${cat.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {cat.isActive !== false ? 'Active' : 'Désactivée'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Aucune catégorie d&apos;évaluation</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ajoutez les catégories d&apos;épreuves (Devoirs, Examens, TP) ou chargez les modèles prédéfinis.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button onClick={handleInitPresets} variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />
                Charger les standards
              </Button>
              <Button onClick={openCreate} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-1.5" />
                Créer manuellement
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Modifier la Catégorie" : "Nouvelle Catégorie d'Évaluation"}</DialogTitle>
            <DialogDescription>
              Configurez le code court et les détails de cette catégorie d&apos;épreuve.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom de la catégorie <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ex: Contrôle Continu / Devoir"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Code court (identifiant d&apos;épreuve) <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ex: CC, QUIZ, EXAM, TP, ORAL"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description / Utilisation pédagogique</Label>
              <Textarea
                placeholder="Ex: Évaluation sommative continue sur les chapitres..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="catActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <Label htmlFor="catActive" className="cursor-pointer text-xs font-medium">
                Catégorie active et disponible pour les enseignants
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                {saving ? 'Enregistrement...' : editingCat ? 'Mettre à jour' : 'Créer la catégorie'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// 4. ASSESSMENT BLUEPRINTS TAB (GRILLES DE PONDÉRATION)
// ═════════════════════════════════════════════════════════════════════════════════
function AssessmentBlueprintsTab({
  academicYears,
  selectedYearId,
  periods,
  classes,
  categories,
  gradingSchemes,
  blueprints,
  onRefresh
}: {
  academicYears: AcademicYear[];
  selectedYearId: string;
  periods: Period[];
  classes: SchoolClass[];
  categories: AssessmentCategory[];
  gradingSchemes: GradingScheme[];
  blueprints: AssessmentBlueprint[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBp, setEditingBp] = useState<AssessmentBlueprint | null>(null);
  const [saving, setSaving] = useState(false);

  // Builder Form state
  const [name, setName] = useState('');
  const [yearId, setYearId] = useState(selectedYearId);
  const [semesterId, setSemesterId] = useState('');
  const [classId, setClassId] = useState('');
  const [gradingSchemeId, setGradingSchemeId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [weights, setWeights] = useState<{ categoryId: string; weight: number; maxScore: number }[]>([]);

  useEffect(() => {
    setYearId(selectedYearId);
  }, [selectedYearId]);

  const totalWeight = useMemo(() => {
    return weights.reduce((acc, w) => acc + (Number(w.weight) || 0), 0);
  }, [weights]);

  const openCreate = () => {
    setEditingBp(null);
    setName(`Grille de Pondération ${academicYears.find(y => String(y.id) === selectedYearId)?.name || ''}`);
    setYearId(selectedYearId);
    setSemesterId('');
    setClassId('');
    setGradingSchemeId('');
    setIsDefault(blueprints.length === 0);

    // Default weight presets (e.g., CC: 40%, EXAM: 60%)
    const quizCat = categories.find(c => c.code === 'QUIZ');
    const examCat = categories.find(c => c.code === 'EXAM');
    if (quizCat && examCat) {
      setWeights([
        { categoryId: String(quizCat.id), weight: 40, maxScore: 20 },
        { categoryId: String(examCat.id), weight: 60, maxScore: 20 },
      ]);
    } else if (categories.length > 0) {
      setWeights([
        { categoryId: String(categories[0].id), weight: 100, maxScore: 20 }
      ]);
    } else {
      setWeights([]);
    }
    setDialogOpen(true);
  };

  const openEdit = (bp: AssessmentBlueprint) => {
    setEditingBp(bp);
    setName(bp.name);
    setYearId(String(bp.academicYear?.id || selectedYearId));
    setSemesterId(bp.semester?.id ? String(bp.semester.id) : '');
    setClassId(bp.classe?.id ? String(bp.classe.id) : '');
    setGradingSchemeId(bp.gradingScheme?.id ? String(bp.gradingScheme.id) : '');
    setIsDefault(Boolean(bp.isDefault));
    setWeights(
      (bp.categoryWeights || []).map(cw => ({
        categoryId: String(cw.categoryId),
        weight: Number(cw.weight || 0),
        maxScore: Number(cw.maxScore || 20),
      }))
    );
    setDialogOpen(true);
  };

  const addWeightRow = () => {
    const unselected = categories.find(c => !weights.some(w => w.categoryId === String(c.id)));
    const targetCatId = unselected ? String(unselected.id) : (categories[0]?.id ? String(categories[0].id) : '');
    setWeights(prev => [...prev, { categoryId: targetCatId, weight: 0, maxScore: 20 }]);
  };

  const updateWeightRow = (idx: number, field: string, value: any) => {
    setWeights(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeWeightRow = (idx: number) => {
    setWeights(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !yearId) {
      toast.error("Le nom et l'année scolaire sont requis");
      return;
    }

    if (weights.length === 0) {
      toast.error("Veuillez ajouter au moins une composante de notation");
      return;
    }

    if (Math.abs(totalWeight - 100) > 0.01) {
      toast.error(`Le total des pondérations doit être exactement égal à 100% (actuellement ${totalWeight}%)`);
      return;
    }

    setSaving(true);
    try {
      const formattedCategoryWeights = weights.map(w => {
        const cat = categories.find(c => String(c.id) === w.categoryId);
        return {
          categoryId: Number(w.categoryId),
          categoryCode: cat?.code || 'EXAM',
          categoryName: cat?.name || 'Évaluation',
          weight: Number(w.weight),
          maxScore: Number(w.maxScore || 20),
        };
      });

      const payload = {
        name: name.trim(),
        totalWeightTarget: 100,
        isDefault,
        categoryWeights: formattedCategoryWeights,
        academicYear: Number(yearId),
        semester: semesterId ? Number(semesterId) : null,
        classe: classId ? Number(classId) : null,
        gradingScheme: gradingSchemeId ? Number(gradingSchemeId) : null,
      };

      if (editingBp) {
        try {
          await api.put(`/admin/assessment-blueprints/${editingBp.id}`, payload);
        } catch {
          await api.put(`/assessment-blueprints/${editingBp.id}`, { data: payload });
        }
        toast.success("Grille de pondération mise à jour");
      } else {
        try {
          await api.post('/admin/assessment-blueprints', payload);
        } catch {
          await api.post('/assessment-blueprints', { data: payload });
        }
        toast.success("Grille de pondération créée avec succès");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bp: AssessmentBlueprint) => {
    if (!confirm(`Supprimer la grille de pondération "${bp.name}" ?`)) return;
    try {
      try {
        await api.delete(`/admin/assessment-blueprints/${bp.id}`);
      } catch {
        await api.delete(`/assessment-blueprints/${bp.id}`);
      }
      toast.success("Grille supprimée");
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur de suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Grilles de Pondération & Coefficients Pédagogiques
          </h2>
          <p className="text-xs text-slate-500">
            Configurez la répartition en pourcentage des notes (ex: Contrôle Continu 40% + Examen de Synthèse 60% = 100%).
          </p>
        </div>

        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Nouvelle Grille de Pondération
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blueprints.map(bp => (
          <Card key={bp.id} className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      {bp.name}
                    </CardTitle>
                    {bp.isDefault && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">
                        Défaut
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {bp.semester && <Badge variant="outline" className="text-xs">{bp.semester.name}</Badge>}
                    {bp.classe && <Badge variant="secondary" className="text-xs">{bp.classe.name}</Badge>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(bp)} className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(bp)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Répartition des Poids (Total 100%):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(bp.categoryWeights || []).map((cw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs font-medium bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{cw.categoryName || cw.categoryCode}:</span>
                      <strong className="text-amber-600 dark:text-amber-400">{cw.weight}%</strong>
                      <span className="text-[10px] text-slate-400">(/ {cw.maxScore || 20}pts)</span>
                    </span>
                  ))}
                </div>
              </div>

              {bp.gradingScheme && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Award className="w-3.5 h-3.5 text-rose-500" />
                  <span>Barème: <strong>{bp.gradingScheme.name}</strong></span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {blueprints.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Aucune grille de pondération</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Configurez une grille de calcul (ex: 40% Devoirs + 60% Examen) pour automatiser le calcul des moyennes semestrielles.
            </p>
            <Button onClick={openCreate} size="sm" className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Créer une grille de pondération
            </Button>
          </div>
        )}
      </div>

      {/* Blueprint Builder Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBp ? "Modifier la Grille" : "Concepteur de Grille de Pondération"}</DialogTitle>
            <DialogDescription>
              Ajustez les pourcentages par composante d&apos;évaluation. Le total doit valoir strictement 100%.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nom de la grille <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ex: Grille Générale Secondaire (40% CC + 60% Examen)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Année Scolaire <span className="text-red-500">*</span></Label>
                <Select value={yearId} onValueChange={setYearId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une année..." />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => (
                      <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Période / Semestre (optionnel)</Label>
                <Select value={semesterId || '__all__'} onValueChange={v => setSemesterId(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les périodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Appliquer à toutes les périodes</SelectItem>
                    {periods.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Classe spécifique (optionnel)</Label>
                <Select value={classId || '__all__'} onValueChange={v => setClassId(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Toutes les classes de l&apos;école</SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Barème de notation associé</Label>
                <Select value={gradingSchemeId || '__default__'} onValueChange={v => setGradingSchemeId(v === '__default__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Barème National sur 20 (Par défaut)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Barème National Standard (sur 20)</SelectItem>
                    {gradingSchemes.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Interactive Weight Builder */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Composantes & Poids en Pourcentage
                  </h4>
                  <p className="text-[11px] text-slate-500">Chaque composante contribue au calcul de la note semestrielle.</p>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  Math.abs(totalWeight - 100) < 0.01
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                }`}>
                  {Math.abs(totalWeight - 100) < 0.01 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  Total: {totalWeight.toFixed(0)}% / 100%
                </div>
              </div>

              <Progress
                value={Math.min(100, totalWeight)}
                className={`h-2 ${Math.abs(totalWeight - 100) < 0.01 ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'}`}
              />

              <div className="space-y-2 mt-3">
                {weights.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <Select value={row.categoryId} onValueChange={v => updateWeightRow(idx, 'categoryId', v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Catégorie d'évaluation..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1 w-28">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={row.weight}
                        onChange={e => updateWeightRow(idx, 'weight', Number(e.target.value))}
                        className="h-8 text-xs font-bold text-right"
                        placeholder="Poids"
                      />
                      <span className="text-xs font-semibold text-slate-500">%</span>
                    </div>

                    <div className="flex items-center gap-1 w-28">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={row.maxScore}
                        onChange={e => updateWeightRow(idx, 'maxScore', Number(e.target.value))}
                        className="h-8 text-xs text-right"
                        placeholder="Note Max"
                      />
                      <span className="text-xs text-slate-400">/20</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWeightRow(idx)}
                      disabled={weights.length === 1}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWeightRow}
                disabled={weights.length >= categories.length}
                className="w-full text-xs h-8 gap-1.5 border-dashed"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une composante de notation
              </Button>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <input
                type="checkbox"
                id="isDefaultBp"
                checked={isDefault}
                onChange={e => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <Label htmlFor="isDefaultBp" className="cursor-pointer text-xs font-medium">
                Définir comme grille de calcul par défaut pour cette année scolaire
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button
                type="submit"
                disabled={saving || Math.abs(totalWeight - 100) > 0.01}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {saving ? 'Enregistrement...' : editingBp ? 'Mettre à jour' : 'Enregistrer la grille'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// 5. GRADING SCHEMES TAB (BARÈMES DE NOTATION SUR 20)
// ═════════════════════════════════════════════════════════════════════════════════
function GradingSchemesTab({
  schemes,
  onRefresh
}: {
  schemes: GradingScheme[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null);
  const [expandedSchemeId, setExpandedSchemeId] = useState<number | null>(schemes[0]?.id || null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [passingScore, setPassingScore] = useState('10');
  const [isDefault, setIsDefault] = useState(false);
  const [tiers, setTiers] = useState<GradeTier[]>(DEFAULT_GUINEA_GRADES);

  const openCreate = () => {
    setEditingScheme(null);
    setName('Barème National Guinéen (Sur 20)');
    setPassingScore('10.0');
    setIsDefault(schemes.length === 0);
    setTiers([...DEFAULT_GUINEA_GRADES]);
    setDialogOpen(true);
  };

  const openEdit = (scheme: GradingScheme) => {
    setEditingScheme(scheme);
    setName(scheme.name);
    setPassingScore(String(scheme.passingScore || 10));
    setIsDefault(Boolean(scheme.isDefault));
    setTiers(scheme.grades?.length ? scheme.grades : [...DEFAULT_GUINEA_GRADES]);
    setDialogOpen(true);
  };

  const addTierRow = () => {
    setTiers(prev => [
      ...prev,
      { min: 0, max: 20, letter: 'N/A', point: 0.0, remark: 'Observation' }
    ]);
  };

  const updateTier = (index: number, field: keyof GradeTier, value: any) => {
    setTiers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeTier = (index: number) => {
    setTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleInitGuineaStandard = async () => {
    try {
      try {
        await api.post('/admin/grading-schemes', {
          name: 'Barème National Officiel (Guinée - sur 20)',
          isDefault: true,
          passingScore: 10.0,
          grades: DEFAULT_GUINEA_GRADES,
        });
      } catch {
        await api.post('/grading-schemes', {
          data: {
            name: 'Barème National Officiel (Guinée - sur 20)',
            isDefault: true,
            passingScore: 10.0,
            grades: DEFAULT_GUINEA_GRADES,
          }
        });
      }
      toast.success("Barème national officiel sur 20 configuré avec succès");
      onRefresh();
    } catch (err: any) {
      toast.error("Erreur lors de la création du barème");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Veuillez saisir le nom du barème");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        passingScore: Number(passingScore) || 10.0,
        isDefault,
        grades: tiers.map(t => ({
          min: Number(t.min),
          max: Number(t.max),
          letter: t.letter.trim(),
          point: Number(t.point),
          remark: t.remark.trim(),
        })),
      };

      if (editingScheme) {
        try {
          await api.put(`/admin/grading-schemes/${editingScheme.id}`, payload);
        } catch {
          await api.put(`/grading-schemes/${editingScheme.id}`, { data: payload });
        }
        toast.success("Barème de notation mis à jour");
      } else {
        try {
          await api.post('/admin/grading-schemes', payload);
        } catch {
          await api.post('/grading-schemes', { data: payload });
        }
        toast.success("Barème de notation créé");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheme: GradingScheme) => {
    if (!confirm(`Supprimer le barème "${scheme.name}" ?`)) return;
    try {
      try {
        await api.delete(`/admin/grading-schemes/${scheme.id}`);
      } catch {
        await api.delete(`/grading-schemes/${scheme.id}`);
      }
      toast.success("Barème supprimé");
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur de suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Barèmes de Notation & Mentions (Échelle sur 20)
          </h2>
          <p className="text-xs text-slate-500">
            Définit les paliers de notation de 0 à 20, le seuil de passage (10.00/20), les points GPA et les mentions honorifiques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {schemes.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleInitGuineaStandard} className="text-xs gap-1.5 border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300">
              <Sparkles className="w-3.5 h-3.5" />
              Initialiser Barème National
            </Button>
          )}
          <Button onClick={openCreate} className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Nouveau Barème
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {(schemes.length > 0 ? schemes : [{
          id: 0,
          name: 'Barème National Officiel (Guinée - sur 20) - Système Intégré',
          isDefault: true,
          passingScore: 10.0,
          grades: DEFAULT_GUINEA_GRADES
        }]).map(scheme => {
          const isExpanded = expandedSchemeId === scheme.id;
          const displayGrades = scheme.grades?.length ? scheme.grades : DEFAULT_GUINEA_GRADES;

          return (
            <Card key={scheme.id} className="border-l-4 border-l-rose-500 overflow-hidden">
              <CardHeader className="py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{scheme.name}</span>
                        {scheme.isDefault && (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 text-[10px]">
                            Défaut Global
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-white dark:bg-slate-900">
                          Seuil d&apos;admission: <strong className="ml-1 text-emerald-600 font-bold">{Number(scheme.passingScore || 10).toFixed(2)} / 20</strong>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {scheme.id > 0 && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(scheme)} className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(scheme)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-500 border-y border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Intervalle Note (/20)</th>
                          <th className="px-4 py-2 font-semibold">Lettre</th>
                          <th className="px-4 py-2 font-semibold">Point GPA</th>
                          <th className="px-4 py-2 font-semibold">Appréciation / Mention</th>
                          <th className="px-4 py-2 font-semibold">Décision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayGrades.map((tier, idx) => {
                          const isPass = tier.min >= (scheme.passingScore || 10);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="px-4 py-2.5 font-mono font-medium text-slate-800 dark:text-slate-200">
                                {tier.min.toFixed(2)} — {tier.max.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-block font-bold px-2 py-0.5 rounded text-xs ${
                                  tier.letter.startsWith('A') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  tier.letter.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                                  tier.letter.startsWith('C') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                }`}>
                                  {tier.letter}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300">
                                {Number(tier.point).toFixed(1)} / 4.0
                              </td>
                              <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                                {tier.remark}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                  isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                                }`}>
                                  {isPass ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                  {isPass ? 'Admis(e)' : 'Ajourné(e)'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Grading Scheme Builder Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScheme ? "Modifier le Barème de Notation" : "Nouveau Barème de Notation sur 20"}</DialogTitle>
            <DialogDescription>
              Ajustez les intervalles de note, les points GPA et les appréciations officielles.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nom du barème <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ex: Barème National Guinéen"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Seuil d&apos;admission (/20) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={passingScore}
                  onChange={e => setPassingScore(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tiers Editor Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Paliers de Notes & Mentions
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addTierRow} className="text-xs h-7 gap-1">
                  <Plus className="w-3 h-3" />
                  Ajouter un palier
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {tiers.map((t, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        value={t.min}
                        onChange={e => updateTier(i, 'min', Number(e.target.value))}
                        className="h-7 text-xs"
                        placeholder="Min"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        value={t.max}
                        onChange={e => updateTier(i, 'max', Number(e.target.value))}
                        className="h-7 text-xs"
                        placeholder="Max"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={t.letter}
                        onChange={e => updateTier(i, 'letter', e.target.value.toUpperCase())}
                        className="h-7 text-xs font-bold uppercase"
                        placeholder="Lettre"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="4"
                        value={t.point}
                        onChange={e => updateTier(i, 'point', Number(e.target.value))}
                        className="h-7 text-xs font-semibold"
                        placeholder="GPA"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={t.remark}
                        onChange={e => updateTier(i, 'remark', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="Mention"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTier(i)}
                        disabled={tiers.length === 1}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <input
                type="checkbox"
                id="isDefaultScheme"
                checked={isDefault}
                onChange={e => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <Label htmlFor="isDefaultScheme" className="cursor-pointer text-xs font-medium">
                Définir comme barème national par défaut sur l&apos;ensemble de la plateforme
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-rose-600 hover:bg-rose-700 text-white">
                {saving ? 'Enregistrement...' : editingScheme ? 'Mettre à jour' : 'Créer le barème'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// 6. RECALCULATION & SNAPSHOT TAB
// ═════════════════════════════════════════════════════════════════════════════════
function RecalculationTab({
  academicYears,
  selectedYearId,
  classes,
  students
}: {
  academicYears: AcademicYear[];
  selectedYearId: string;
  classes: SchoolClass[];
  students: StudentUser[];
}) {
  const [yearId, setYearId] = useState(selectedYearId);
  const [mode, setMode] = useState<'class' | 'student'>('class');
  const [targetClassId, setTargetClassId] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [resultSummary, setResultSummary] = useState<any>(null);

  useEffect(() => {
    setYearId(selectedYearId);
  }, [selectedYearId]);

  const handleRunRecalculate = async () => {
    if (!yearId) {
      toast.error("Veuillez sélectionner une année scolaire");
      return;
    }

    if (mode === 'class' && !targetClassId) {
      toast.error("Veuillez sélectionner une classe à recalculer");
      return;
    }

    if (mode === 'student' && !targetStudentId) {
      toast.error("Veuillez sélectionner un élève");
      return;
    }

    setCalculating(true);
    setResultSummary(null);
    try {
      if (mode === 'class') {
        const res = await api.post(`/admin/recalculate/class/${targetClassId}?academicYearId=${yearId}`);
        setResultSummary({
          type: 'class',
          data: res.data,
          className: classes.find(c => String(c.id) === targetClassId)?.name || 'Classe',
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
        toast.success("Recalcul de classe terminé avec succès");
      } else {
        const res = await api.post(`/admin/recalculate/student/${targetStudentId}?academicYearId=${yearId}`);
        const student = students.find(s => String(s.id) === targetStudentId);
        const name = student?.firstName && student?.lastName ? `${student.firstName} ${student.lastName}` : (student?.username || 'Élève');
        setResultSummary({
          type: 'student',
          data: res.data,
          studentName: name,
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
        toast.success("Recalcul de l'élève terminé avec succès");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Erreur lors du recalcul des notes");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-l-4 border-l-emerald-500 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Moteur de Recalcul & Synchronisation des Moyennes
              </CardTitle>
              <CardDescription className="text-xs">
                Exécute le moteur académique centralisé pour compiler les examens, appliquer les grilles de pondération et synchroniser les bulletins.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Année Scolaire de référence</Label>
              <Select value={yearId} onValueChange={setYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une année..." />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Portée du Recalcul</Label>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setMode('class')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    mode === 'class' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Toute une Classe
                </button>
                <button
                  type="button"
                  onClick={() => setMode('student')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    mode === 'student' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Un Élève Spécifique
                </button>
              </div>
            </div>
          </div>

          {mode === 'class' ? (
            <div className="space-y-1.5">
              <Label>Sélectionner la classe à synchroniser</Label>
              <Select value={targetClassId} onValueChange={setTargetClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une classe (ex: 10ème Année A)..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Sélectionner l&apos;élève</Label>
              <Select value={targetStudentId} onValueChange={setTargetStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un élève..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => {
                    const fullName = s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.username;
                    return (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {fullName} ({s.userId || s.username})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Le moteur parcourt l&apos;ensemble des épreuves notées, calcule les moyennes pondérées sur 20, détermine les mentions et met à jour instantanément les relevés de notes dans le registre d&apos;archivage.
            </p>
          </div>

          <Button
            onClick={handleRunRecalculate}
            disabled={calculating || (mode === 'class' ? !targetClassId : !targetStudentId)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 shadow-sm gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Recalcul en cours...' : 'Lancer le Recalcul & Synchroniser'}
          </Button>

          {/* Result Output Card */}
          {resultSummary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 text-white p-4 rounded-xl space-y-2 font-mono text-xs mt-4 shadow-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Synchronisation Réussie
                </span>
                <span className="text-slate-400 text-[11px]">{resultSummary.timestamp}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                <div>
                  <span className="text-slate-500">Cible:</span>{' '}
                  <strong className="text-white">
                    {resultSummary.type === 'class' ? resultSummary.className : resultSummary.studentName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Élèves traités:</span>{' '}
                  <strong className="text-white">{resultSummary.data?.studentsProcessed ?? 1}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Enregistrements mis à jour:</span>{' '}
                  <strong className="text-emerald-400">{resultSummary.data?.totalUpdated ?? resultSummary.data?.updated ?? 0}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Statut:</span>{' '}
                  <span className="text-emerald-400 font-bold">CALCULATED</span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
