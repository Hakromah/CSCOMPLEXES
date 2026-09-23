// academic-engine.ts - Centralized Calculation Engine for Guinea Conakry (Sur 20)
// Single Source of Truth for all academic grade calculations.

export const DEFAULT_GRADING_SCHEME: any[] = [
  { min: 18.00, max: 20.00, letter: 'A+', point: 20.0, remark: 'Excellent', decision: 'Admis(e) avec Félicitations' },
  { min: 16.00, max: 17.99, letter: 'A',  point: 16.0, remark: 'Très Bien', decision: 'Admis(e) - Tableau d\'Honneur' },
  { min: 14.00, max: 15.99, letter: 'B',  point: 14.0, remark: 'Bien',      decision: 'Admis(e) - Encouragements' },
  { min: 12.00, max: 13.99, letter: 'C',  point: 12.0, remark: 'Assez Bien', decision: 'Admis(e)' },
  { min: 10.00, max: 11.99, letter: 'D',  point: 10.0, remark: 'Passable',   decision: 'Admis(e)' },
  { min: 8.00,  max: 9.99,  letter: 'E',  point: 8.0,  remark: 'Insuffisant', decision: 'Avertissement' },
  { min: 0.00,  max: 7.99,  letter: 'F',  point: 0.0,  remark: 'Faible',      decision: 'Blâme' },
];

export function resolveGrade(scoreOrPercentage: number, scheme?: any[]): {
  score20: number;
  percentage: number;
  letter: string;
  point: number;
  remark: string;
  decision: string;
  isPassing: boolean;
} {
  const grades = (scheme && Array.isArray(scheme) && scheme.length > 0) ? scheme : DEFAULT_GRADING_SCHEME;
  const num = Number(scoreOrPercentage) || 0;

  let score20: number;
  let pct: number;
  if (num > 20) {
    pct = Math.min(100, Math.max(0, num));
    score20 = (pct / 100) * 20;
  } else {
    score20 = Math.min(20, Math.max(0, num));
    pct = (score20 / 20) * 100;
  }
  score20 = Math.round(score20 * 100) / 100;
  pct = Math.round(pct * 100) / 100;

  // Determine if scheme has max <= 20
  const isScale20 = grades.some((g: any) => g.max <= 20);
  const target = isScale20 ? score20 : pct;

  const match = grades.find((g: any) => target >= g.min && target <= (g.max + 0.001));
  const letter = match?.letter || (score20 >= 10 ? 'D' : 'F');
  const remark = match?.remark || (score20 >= 16 ? 'Très Bien' : score20 >= 14 ? 'Bien' : score20 >= 12 ? 'Assez Bien' : score20 >= 10 ? 'Passable' : 'Insuffisant');
  const decision = match?.decision || (score20 >= 10 ? 'Admis(e)' : 'Ajourné(e)');
  const point = Number(match?.point ?? score20);
  const isPassing = score20 >= 10.0;

  return {
    score20,
    percentage: pct,
    letter,
    point,
    remark,
    decision,
    isPassing
  };
}

function buildFallbackWeights(exams: any[]): any[] {
  const total = exams.reduce((s: number, e: any) => s + Number(e.weight || 1), 0);
  return exams.map((e: any) => ({
    examId: e.id,
    examName: e.name,
    categoryCode: e.assessmentCategory?.code || 'EXAM',
    categoryName: e.assessmentCategory?.name || e.name,
    weight: total > 0 ? (Number(e.weight || 1) / total) * 100 : 100 / exams.length,
    maxScore: Number(e.maxScore || 20),
  }));
}

export const academicEngine = {

  async resolveGradingScheme(blueprintId?: number): Promise<any[]> {
    if (!blueprintId) return DEFAULT_GRADING_SCHEME;
    try {
      const bp = await (strapi.entityService.findOne as any)('api::assessment-blueprint.assessment-blueprint', blueprintId, { populate: ['gradingScheme'] }) as any;
      if (bp?.gradingScheme?.grades && Array.isArray(bp.gradingScheme.grades) && bp.gradingScheme.grades.length > 0) {
        return bp.gradingScheme.grades;
      }
    } catch (e) {}
    return DEFAULT_GRADING_SCHEME;
  },

  async calculateSubjectResult(studentId: number, subjectId: number, semesterId: number, academicYearId: number): Promise<any> {
    try {
      const exams = await (strapi.entityService.findMany as any)('api::school-exam.school-exam', {
        filters: { subject: { id: subjectId }, semesterRel: { id: semesterId }, academicYear: { id: academicYearId } },
        populate: ['assessmentCategory', 'blueprint']
      }) as any[];

      if (!exams || exams.length === 0) return null;
      const examIds = exams.map((e: any) => e.id);
      const DIN = '$in';
      const results = await (strapi.entityService.findMany as any)('api::exam-result.exam-result', {
        filters: { student: { id: studentId }, exam: { id: { [DIN]: examIds } } },
        populate: ['exam', 'exam.assessmentCategory']
      }) as any[];

      const blueprintId = exams.find((e: any) => e.blueprint?.id)?.blueprint?.id;
      let categoryWeights: any[] = [];
      if (blueprintId) {
        const bp = await (strapi.entityService.findOne as any)('api::assessment-blueprint.assessment-blueprint', blueprintId) as any;
        categoryWeights = (bp?.categoryWeights as any[]) || [];
      }

      const useFallback = categoryWeights.length === 0;
      const fallbackWeights = useFallback ? buildFallbackWeights(exams) : [];
      const gradingScheme = await this.resolveGradingScheme(blueprintId);
      const scoreBreakdown: any[] = [];
      let totalWeightUsed = 0;
      let totalWeightedPoints = 0;

      if (useFallback) {
        for (const fw of fallbackWeights) {
          const result = (results || []).find((r: any) => r.exam?.id === fw.examId);
          const rawScore = result ? Number(result.marks ?? result.rawScore) : null;
          const maxScore = fw.maxScore || 20;
          const wDec = fw.weight / 100;
          let contributed20 = 0;
          let noteSur20 = 0;
          if (rawScore !== null && !isNaN(rawScore)) {
            noteSur20 = (rawScore / maxScore) * 20;
            contributed20 = noteSur20 * wDec;
            totalWeightedPoints += (rawScore / maxScore) * wDec * 100;
            totalWeightUsed += fw.weight;
          }
          scoreBreakdown.push({
            examId: fw.examId,
            examName: fw.examName,
            category: fw.categoryName,
            rawScore,
            maxScore,
            noteSur20: Math.round(noteSur20 * 100) / 100,
            weight: fw.weight,
            contributed: Math.round(contributed20 * 100) / 100,
            scoreStatus: rawScore !== null ? 'NUMERIC' : 'MISSING'
          });
        }
      } else {
        const catMap = new Map<string, { weight: number; maxScore: number; scores: number[]; name: string }>();
        for (const cw of categoryWeights) {
          catMap.set(cw.categoryCode, {
            weight: Number(cw.weight || 0),
            maxScore: Number(cw.maxScore || 20),
            scores: [],
            name: cw.categoryName || cw.categoryCode
          });
        }
        for (const r of (results || [])) {
          const code = r.exam?.assessmentCategory?.code || 'EXAM';
          const entry = catMap.get(code);
          const val = Number(r.marks ?? r.rawScore);
          if (entry && !isNaN(val)) {
            entry.scores.push(val);
          }
        }
        for (const [code, entry] of catMap.entries()) {
          const avg = entry.scores.length > 0 ? entry.scores.reduce((a: number, b: number) => a + b, 0) / entry.scores.length : null;
          const wDec = entry.weight / 100;
          let contributed20 = 0;
          let noteSur20 = 0;
          if (avg !== null) {
            noteSur20 = (avg / entry.maxScore) * 20;
            contributed20 = noteSur20 * wDec;
            totalWeightedPoints += (avg / entry.maxScore) * wDec * 100;
            totalWeightUsed += entry.weight;
          }
          scoreBreakdown.push({
            categoryCode: code,
            category: entry.name,
            scores: entry.scores,
            avgScore: avg !== null ? Math.round(avg * 100) / 100 : null,
            maxScore: entry.maxScore,
            noteSur20: Math.round(noteSur20 * 100) / 100,
            weight: entry.weight,
            contributed: Math.round(contributed20 * 100) / 100,
            scoreStatus: avg !== null ? 'NUMERIC' : 'MISSING'
          });
        }
      }

      const percentage = totalWeightUsed > 0 ? Math.round((totalWeightedPoints / (totalWeightUsed / 100)) * 100) / 100 : 0;
      const score20 = Math.round((percentage / 100) * 20 * 100) / 100;
      const gradeInfo = resolveGrade(score20, gradingScheme);

      return {
        subjectId,
        semesterId,
        academicYearId,
        score20: gradeInfo.score20,
        percentage: gradeInfo.percentage,
        letterGrade: gradeInfo.letter,
        gradePoint: gradeInfo.score20,
        remark: gradeInfo.remark,
        decision: gradeInfo.decision,
        isPassing: gradeInfo.isPassing,
        scoreBreakdown,
        totalWeightUsed,
        hasScores: (results || []).length > 0,
        blueprintId: blueprintId || null
      };
    } catch (err) {
      strapi.log.error('calculateSubjectResult error:', err);
      return null;
    }
  },

  async calculatePeriodResult(studentId: number, semesterId: number, academicYearId: number): Promise<any> {
    try {
      // Find classes for student
      const studentClasses = await (strapi.entityService.findMany as any)('api::school-class.school-class', {
        filters: { students: { id: studentId } }
      }) as any[];
      const classIds = (studentClasses || []).map((c: any) => c.id);

      const DIN = '$in';
      const examFilters: any = {
        semesterRel: { id: semesterId },
        academicYear: { id: academicYearId }
      };
      if (classIds.length > 0) {
        examFilters.classe = { id: { [DIN]: classIds } };
      }

      const examsInPeriod = await (strapi.entityService.findMany as any)('api::school-exam.school-exam', {
        filters: examFilters,
        populate: ['subject', 'classe']
      }) as any[];

      const subjectMap = new Map<number, any>();
      for (const exam of (examsInPeriod || [])) {
        if (exam.subject?.id) subjectMap.set(exam.subject.id, exam.subject);
      }

      // Also discover any subjects where the student has recorded exam results for this semester & year
      const studentResults = await (strapi.entityService.findMany as any)('api::exam-result.exam-result', {
        filters: {
          student: { id: studentId },
          exam: {
            semesterRel: { id: semesterId },
            academicYear: { id: academicYearId }
          }
        },
        populate: ['exam', 'exam.subject']
      }) as any[];

      for (const res of (studentResults || [])) {
        if (res.exam?.subject?.id) {
          subjectMap.set(res.exam.subject.id, res.exam.subject);
        }
      }

      const subjectResults: any[] = [];
      for (const [subjectId, subject] of subjectMap.entries()) {
        const result = await this.calculateSubjectResult(studentId, subjectId, semesterId, academicYearId);
        if (result) {
          subjectResults.push({ ...result, subjectName: subject.name, subjectCode: subject.code });
        }
      }

      const valid = subjectResults.filter((r: any) => r.hasScores);
      const periodAvg20 = valid.length > 0 ? Math.round(valid.reduce((s: number, r: any) => s + (r.score20 ?? ((r.percentage || 0) / 5)), 0) / valid.length * 100) / 100 : 0;
      const periodPct = Math.round((periodAvg20 / 20) * 100 * 100) / 100;
      const pgi = resolveGrade(periodAvg20);

      return {
        semesterId,
        academicYearId,
        subjectResults,
        periodAverage: periodAvg20,
        periodAverage20: periodAvg20,
        periodPercentage: periodPct,
        periodGrade: pgi.letter,
        periodRemark: pgi.remark,
        periodDecision: pgi.decision,
        periodGPA: periodAvg20,
        subjectCount: valid.length
      };
    } catch (err) {
      strapi.log.error('calculatePeriodResult error:', err);
      return { semesterId, academicYearId, subjectResults: [], periodAverage: 0, periodAverage20: 0, periodGPA: 0, subjectCount: 0 };
    }
  },

  async calculateAnnualResult(studentId: number, academicYearId: number): Promise<any> {
    const semesters = await (strapi.entityService.findMany as any)('api::semester.semester', {
      filters: { academicYear: { id: academicYearId } },
      sort: [{ order: 'asc' }]
    }) as any[];

    const periodResults: any[] = [];
    for (const sem of (semesters || [])) {
      const r = await this.calculatePeriodResult(studentId, sem.id, academicYearId);
      periodResults.push({
        ...r,
        semesterName: sem.name,
        periodType: sem.periodType || 'SEMESTER',
        semesterOrder: sem.order || 1
      });
    }

    const all = periodResults.flatMap((p: any) => (p.subjectResults || []).filter((r: any) => r.hasScores));
    const annualAvg20 = all.length > 0 ? Math.round(all.reduce((s: number, r: any) => s + (r.score20 ?? ((r.percentage || 0) / 5)), 0) / all.length * 100) / 100 : 0;
    const annualPct = Math.round((annualAvg20 / 20) * 100 * 100) / 100;
    const gi = resolveGrade(annualAvg20);

    return {
      academicYearId,
      periodResults,
      annualAverage: annualAvg20,
      annualAverage20: annualAvg20,
      annualPercentage: annualPct,
      annualGPA: annualAvg20,
      annualGrade: gi.letter,
      annualRemark: gi.remark,
      annualDecision: gi.decision,
      isPassing: gi.isPassing,
      totalSubjects: new Set(all.map((r: any) => r.subjectId)).size,
      totalPeriods: periodResults.length,
      periodsWithData: periodResults.filter((p: any) => p.subjectCount > 0).length
    };
  },

  async generateTranscriptAuto(studentId: number, academicYearId: number, saveToLedger: boolean = false): Promise<any> {
    const crypto = require('crypto');
    const student = await (strapi.entityService.findOne as any)('plugin::users-permissions.user', studentId, {
      populate: ['enrolledClasses']
    }) as any;
    if (!student) throw new Error('Student not found with ID: ' + studentId);

    const academicYear = await (strapi.entityService.findOne as any)('api::academic-year.academic-year', academicYearId) as any;
    if (!academicYear) throw new Error('Academic year not found with ID: ' + academicYearId);

    const studentClasses = await (strapi.entityService.findMany as any)('api::school-class.school-class', {
      filters: { students: { id: studentId } }
    }) as any[];
    const classNames = (studentClasses || []).map((c: any) => c.name);
    if (classNames.length === 0 && student.enrolledClasses) {
      classNames.push(...student.enrolledClasses.map((c: any) => c.name));
    }

    let schoolInfo = { name: '2CS COMPLEXE SCOLAIRE', address: 'Moribaya Forecariah, Conakry Guinée', email: '2complexes@gmail.com', phone: '+224613111190' };
    try {
      const ciList = await (strapi.entityService.findMany as any)('api::contact-info.contact-info', { populate: ['phones', 'email'] }) as any[];
      const ci = Array.isArray(ciList) ? ciList[0] : ciList;
      if (ci) {
        if (ci.address) schoolInfo.address = ci.address;
        if (ci.phones?.[0]?.phones || ci.phone) schoolInfo.phone = ci.phones?.[0]?.phones || ci.phone;
        if (ci.email?.[0]?.address || ci.email) schoolInfo.email = ci.email?.[0]?.address || ci.email;
      }
    } catch (e) {}
    try {
      const nbs = await (strapi.entityService.findMany as any)('api::navbar.navbar') as any[];
      const nb = Array.isArray(nbs) ? nbs[0] : nbs;
      if (nb?.title) schoolInfo.name = nb.title;
    } catch (e) {}

    const annualResult = await this.calculateAnnualResult(studentId, academicYearId);
    const hashInput = 'auto-' + studentId + '-' + academicYearId;
    const hash = crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 8).toUpperCase();
    const yearCode = (academicYear.name || '').replace(/[^A-Z0-9]/gi, '');
    const refNum = 'TR-AUTO-' + (student.userId || student.id) + '-' + yearCode + '-' + hash;
    const generationDate = new Date().toISOString();
    const friendlyDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    // Build standardized results list on scale of 20
    const results: any[] = [];
    for (const pr of (annualResult.periodResults || [])) {
      for (const sr of (pr.subjectResults || [])) {
        if (sr.hasScores) {
          const s20 = sr.score20 != null ? Number(sr.score20) : Math.round(((sr.percentage || 0) / 5) * 100) / 100;
          results.push({
            id: `${pr.semesterId}-${sr.subjectId}`,
            subjectId: sr.subjectId,
            subjectCode: sr.subjectCode || 'N/A',
            subjectName: sr.subjectName || 'N/A',
            className: classNames.join(', ') || 'N/A',
            examName: pr.semesterName || 'Évaluation',
            semester: pr.semesterName || 'Période',
            term: pr.periodType || 'Semestre',
            academicYear: academicYear.name || 'N/A',
            marks: s20,
            marks20: s20,
            percentage: sr.percentage,
            coefficient: 1,
            totalPoints: s20,
            letterGrade: sr.letterGrade,
            gradePoint: s20,
            remarks: sr.remark || '',
            decision: sr.decision || (s20 >= 10 ? 'Admis(e)' : 'Ajourné(e)'),
            scoreBreakdown: sr.scoreBreakdown || []
          });
        }
      }
    }

    if (saveToLedger) {
      try {
        const existing = await (strapi.entityService.findMany as any)('api::transcript.transcript', { filters: { referenceNumber: refNum } }) as any[];
        const payload: any = {
          referenceNumber: refNum,
          generationDate,
          gpa: annualResult.annualAverage,
          averageScore: annualResult.annualAverage,
          student: studentId,
          academicYear: academicYearId,
          class: studentClasses?.[0]?.id || null,
          semesters: annualResult.periodResults.map((p: any) => p.semesterId),
          terms: []
        };
        if (existing && existing.length > 0) {
          await (strapi.entityService.update as any)('api::transcript.transcript', existing[0].id, { data: payload });
        } else {
          await (strapi.entityService.create as any)('api::transcript.transcript', { data: payload });
        }
      } catch (dbErr) {
        strapi.log.warn('Failed to save auto-transcript to registry:', dbErr);
      }
    }

    const studentFullName = (student.firstName && student.lastName)
      ? `${student.firstName} ${student.lastName}`
      : (student.name || student.username || 'Élève');

    return {
      student: {
        id: student.id,
        userId: student.userId,
        name: studentFullName,
        username: student.username,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        birthDate: student.birthDate,
        phoneNumber: student.phoneNumber,
        classes: classNames
      },
      school: schoolInfo,
      academicYear: { id: academicYearId, name: academicYear.name },
      annualResult,
      results,
      summary: {
        totalSubjectsCount: annualResult.totalSubjects,
        totalSubjects: annualResult.totalSubjects,
        weightedAverageScore: annualResult.annualAverage,
        averageScore: annualResult.annualAverage,
        annualAverage: annualResult.annualAverage,
        annualAverageDisplay: `${Number(annualResult.annualAverage || 0).toFixed(2)} / 20`,
        gpa: annualResult.annualAverage,
        annualGPA: annualResult.annualAverage,
        annualGrade: annualResult.annualGrade,
        annualRemark: annualResult.annualRemark,
        annualDecision: annualResult.annualDecision || (annualResult.annualAverage >= 10 ? 'Admis(e)' : 'Ajourné(e)'),
        isPassing: annualResult.annualAverage >= 10.0,
        scale: 20,
        passingGrade: 10.0,
        totalPeriods: annualResult.totalPeriods,
        periodsWithData: annualResult.periodsWithData
      },
      metadata: {
        referenceNumber: refNum,
        generationDate: friendlyDate,
        academicYears: [academicYear.name],
        academicYearName: academicYear.name,
        semesters: (annualResult.periodResults || []).map((p: any) => p.semesterName),
        terms: [],
        generatedAt: generationDate
      }
    };
  },

  async saveCalculatedResult(studentId: number, subjectId: number, semesterId: number, academicYearId: number, classId?: number) {
    const result = await this.calculateSubjectResult(studentId, subjectId, semesterId, academicYearId);
    if (!result) return null;
    const existing = await (strapi.entityService.findMany as any)('api::academic-result.academic-result', {
      filters: { student: { id: studentId }, subject: { id: subjectId }, semester: { id: semesterId }, academicYear: { id: academicYearId } }
    }) as any[];
    const payload: any = {
      totalScore: result.score20,
      percentage: result.percentage,
      letterGrade: result.letterGrade,
      gradePoint: result.score20,
      remarks: result.remark,
      scoreBreakdown: result.scoreBreakdown,
      calculatedAt: new Date().toISOString(),
      status: 'CALCULATED',
      student: studentId,
      subject: subjectId,
      semester: semesterId,
      academicYear: academicYearId,
      ...(classId ? { classe: classId } : {}),
      ...(result.blueprintId ? { blueprint: result.blueprintId } : {})
    };
    if (existing && existing.length > 0) {
      return (strapi.entityService.update as any)('api::academic-result.academic-result', existing[0].id, { data: payload });
    }
    return (strapi.entityService.create as any)('api::academic-result.academic-result', { data: payload });
  },

  async recalculateStudent(studentId: number, academicYearId: number): Promise<{ updated: number }> {
    const semesters = await (strapi.entityService.findMany as any)('api::semester.semester', {
      filters: { academicYear: { id: academicYearId } }
    }) as any[];
    let updated = 0;
    for (const sem of (semesters || [])) {
      const pr = await this.calculatePeriodResult(studentId, sem.id, academicYearId);
      for (const sr of (pr.subjectResults || [])) {
        if (sr.hasScores) {
          await this.saveCalculatedResult(studentId, sr.subjectId, sem.id, academicYearId);
          updated++;
        }
      }
    }
    return { updated };
  },

  async getDynamicGradebook(classId: number, subjectId?: number, semesterId?: number): Promise<any> {
    const cls = await (strapi.entityService.findOne as any)('api::school-class.school-class', classId, {
      populate: ['students', 'academicYear']
    }) as any;
    const students = cls?.students || [];
    const examFilters: any = { classe: { id: classId } };
    if (subjectId) examFilters.subject = { id: subjectId };
    if (semesterId) examFilters.semesterRel = { id: semesterId };

    const exams = await (strapi.entityService.findMany as any)('api::school-exam.school-exam', {
      filters: examFilters,
      populate: ['subject', 'assessmentCategory', 'semesterRel'],
      sort: [{ date: 'asc' }]
    }) as any[];

    if (!exams || exams.length === 0) {
      return { classId, className: cls?.name, columns: [], rows: [] };
    }

    const examIds = exams.map((e: any) => e.id);
    const DIN = '$in';
    const allResults = await (strapi.entityService.findMany as any)('api::exam-result.exam-result', {
      filters: { exam: { id: { [DIN]: examIds } } },
      populate: ['student', 'exam']
    }) as any[];

    const resultMap = new Map<number, Map<number, any>>();
    for (const r of (allResults || [])) {
      if (!r.student?.id) continue;
      if (!resultMap.has(r.student.id)) resultMap.set(r.student.id, new Map());
      resultMap.get(r.student.id)!.set(r.exam?.id, r);
    }

    const columns = exams.map((e: any) => ({
      examId: e.id,
      examName: e.name,
      subjectName: e.subject?.name,
      subjectId: e.subject?.id,
      categoryCode: e.assessmentCategory?.code || 'EXAM',
      categoryName: e.assessmentCategory?.name || e.name,
      semesterName: e.semesterRel?.name,
      semesterId: e.semesterRel?.id,
      maxScore: e.maxScore || 20,
      weight: e.weight || 0,
      dueDate: e.dueDate,
      examStatus: e.examStatus
    }));

    const rows = students.map((student: any) => {
      const sRes = resultMap.get(student.id) || new Map();
      const scores: any = {};
      let totalValid = 0;
      let totalScore20 = 0;
      for (const col of columns) {
        const r = sRes.get(col.examId);
        if (r) {
          const raw = Number(r.marks ?? r.rawScore ?? 0);
          const maxS = col.maxScore || 20;
          const note20 = (raw / maxS) * 20;
          scores[col.examId] = {
            resultId: r.id,
            marks: raw,
            note20: Math.round(note20 * 100) / 100,
            maxScore: col.maxScore,
            letterGrade: r.letterGrade,
            scoreStatus: r.scoreStatus || 'NUMERIC',
            status: r.status
          };
          totalValid++;
          totalScore20 += note20;
        } else {
          scores[col.examId] = null;
        }
      }
      const average20 = totalValid > 0 ? Math.round((totalScore20 / totalValid) * 100) / 100 : null;
      const gi2 = average20 !== null ? resolveGrade(average20) : null;
      const studentFullName = (student.firstName && student.lastName)
        ? `${student.firstName} ${student.lastName}`
        : (student.username || 'Élève');
      return {
        studentId: student.id,
        studentName: studentFullName,
        studentUserId: student.userId,
        scores,
        average: average20,
        average20,
        letterGrade: gi2?.letter || null,
        remark: gi2?.remark || null,
        decision: gi2?.decision || null,
        gradePoint: average20
      };
    }).sort((a: any, b: any) => (a.studentName || '').localeCompare(b.studentName || ''));

    return { classId, className: cls?.name, academicYearId: cls?.academicYear?.id, columns, rows };
  },
};

export default academicEngine;
