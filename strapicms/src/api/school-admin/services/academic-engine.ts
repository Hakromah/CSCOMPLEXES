// academic-engine.ts - Centralized Calculation Engine
// Single Source of Truth for all academic grade calculations.

const DEFAULT_GRADING_SCHEME: any[] = [
  { min: 90, max: 100, letter: 'A',  point: 4.0, remark: 'Excellent' },
  { min: 85, max: 89,  letter: 'A-', point: 3.7, remark: 'Tres Bien' },
  { min: 80, max: 84,  letter: 'B+', point: 3.3, remark: 'Bien' },
  { min: 75, max: 79,  letter: 'B',  point: 3.0, remark: 'Assez Bien' },
  { min: 70, max: 74,  letter: 'B-', point: 2.7, remark: 'Satisfaisant' },
  { min: 65, max: 69,  letter: 'C+', point: 2.3, remark: 'Passable' },
  { min: 60, max: 64,  letter: 'C',  point: 2.0, remark: 'Passable' },
  { min: 50, max: 59,  letter: 'D',  point: 1.0, remark: 'Insuffisant' },
  { min: 0,  max: 49,  letter: 'F',  point: 0.0, remark: 'Echec' },
];

function resolveGrade(percentage: number, scheme?: any[]): { letter: string; point: number; remark: string } {
  const grades = (scheme && Array.isArray(scheme) && scheme.length > 0) ? scheme : DEFAULT_GRADING_SCHEME;
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));
  const match = grades.find((g: any) => pct >= g.min && pct <= g.max);
  return match ? { letter: match.letter, point: Number(match.point || 0), remark: match.remark }
               : { letter: 'F', point: 0.0, remark: 'Echec' };
}

function buildFallbackWeights(exams: any[]): any[] {
  const total = exams.reduce((s: number, e: any) => s + Number(e.weight || 1), 0);
  return exams.map((e: any) => ({
    examId: e.id,
    examName: e.name,
    categoryCode: e.assessmentCategory?.code || 'EXAM',
    categoryName: e.assessmentCategory?.name || e.name,
    weight: total > 0 ? (Number(e.weight || 1) / total) * 100 : 100 / exams.length,
    maxScore: Number(e.maxScore || 100),
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
          const maxScore = fw.maxScore || 100;
          const wDec = fw.weight / 100;
          let contributed = 0;
          if (rawScore !== null && !isNaN(rawScore)) {
            contributed = (rawScore / maxScore) * wDec * 100;
            totalWeightedPoints += contributed;
            totalWeightUsed += fw.weight;
          }
          scoreBreakdown.push({
            examId: fw.examId,
            examName: fw.examName,
            category: fw.categoryName,
            rawScore,
            maxScore,
            weight: fw.weight,
            contributed: Math.round(contributed * 100) / 100,
            scoreStatus: rawScore !== null ? 'NUMERIC' : 'MISSING'
          });
        }
      } else {
        const catMap = new Map<string, { weight: number; maxScore: number; scores: number[]; name: string }>();
        for (const cw of categoryWeights) {
          catMap.set(cw.categoryCode, {
            weight: Number(cw.weight || 0),
            maxScore: Number(cw.maxScore || 100),
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
          let contributed = 0;
          if (avg !== null) {
            contributed = (avg / entry.maxScore) * wDec * 100;
            totalWeightedPoints += contributed;
            totalWeightUsed += entry.weight;
          }
          scoreBreakdown.push({
            categoryCode: code,
            category: entry.name,
            scores: entry.scores,
            avgScore: avg !== null ? Math.round(avg * 100) / 100 : null,
            maxScore: entry.maxScore,
            weight: entry.weight,
            contributed: Math.round(contributed * 100) / 100,
            scoreStatus: avg !== null ? 'NUMERIC' : 'MISSING'
          });
        }
      }

      const percentage = totalWeightUsed > 0 ? Math.round((totalWeightedPoints / (totalWeightUsed / 100)) * 100) / 100 : 0;
      const gradeInfo = resolveGrade(percentage, gradingScheme);

      return {
        subjectId,
        semesterId,
        academicYearId,
        percentage,
        letterGrade: gradeInfo.letter,
        gradePoint: gradeInfo.point,
        remark: gradeInfo.remark,
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
      const periodAvg = valid.length > 0 ? Math.round(valid.reduce((s: number, r: any) => s + r.percentage, 0) / valid.length * 100) / 100 : 0;
      const periodGPA = valid.length > 0 ? Math.round(valid.reduce((s: number, r: any) => s + r.gradePoint, 0) / valid.length * 100) / 100 : 0;

      return {
        semesterId,
        academicYearId,
        subjectResults,
        periodAverage: periodAvg,
        periodGPA,
        subjectCount: valid.length
      };
    } catch (err) {
      strapi.log.error('calculatePeriodResult error:', err);
      return { semesterId, academicYearId, subjectResults: [], periodAverage: 0, periodGPA: 0, subjectCount: 0 };
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
    const annualAverage = all.length > 0 ? Math.round(all.reduce((s: number, r: any) => s + r.percentage, 0) / all.length * 100) / 100 : 0;
    const annualGPA = all.length > 0 ? Math.round(all.reduce((s: number, r: any) => s + r.gradePoint, 0) / all.length * 100) / 100 : 0;
    const gi = resolveGrade(annualAverage);

    return {
      academicYearId,
      periodResults,
      annualAverage,
      annualGPA,
      annualGrade: gi.letter,
      annualRemark: gi.remark,
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

    let schoolInfo = { name: '2CS COMPLEXE SCOLAIRE', address: '', email: '', phone: '' };
    try {
      const ciList = await (strapi.entityService.findMany as any)('api::contact-info.contact-info', { populate: ['phones', 'email'] }) as any[];
      const ci = Array.isArray(ciList) ? ciList[0] : ciList;
      if (ci) {
        schoolInfo.address = ci.address || '';
        schoolInfo.phone = ci.phones?.[0]?.phones || ci.phone || '';
        schoolInfo.email = ci.email?.[0]?.address || ci.email || '';
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

    // Build standardized results list of all evaluated subjects with scores
    const results: any[] = [];
    for (const pr of (annualResult.periodResults || [])) {
      for (const sr of (pr.subjectResults || [])) {
        if (sr.hasScores) {
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
            marks: sr.percentage,
            letterGrade: sr.letterGrade,
            gradePoint: sr.gradePoint,
            remarks: sr.remark || '',
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
          gpa: annualResult.annualGPA,
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

    return {
      student: {
        id: student.id,
        userId: student.userId,
        name: student.username,
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
        gpa: annualResult.annualGPA,
        annualGPA: annualResult.annualGPA,
        annualGrade: annualResult.annualGrade,
        annualRemark: annualResult.annualRemark,
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
      totalScore: result.percentage,
      percentage: result.percentage,
      letterGrade: result.letterGrade,
      gradePoint: result.gradePoint,
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
      maxScore: e.maxScore || 100,
      weight: e.weight || 0,
      dueDate: e.dueDate,
      examStatus: e.examStatus
    }));

    const rows = students.map((student: any) => {
      const sRes = resultMap.get(student.id) || new Map();
      const scores: any = {};
      let totalValid = 0;
      let totalScore = 0;
      for (const col of columns) {
        const r = sRes.get(col.examId);
        if (r) {
          scores[col.examId] = {
            resultId: r.id,
            marks: r.marks ?? r.rawScore,
            maxScore: col.maxScore,
            letterGrade: r.letterGrade,
            scoreStatus: r.scoreStatus || 'NUMERIC',
            status: r.status
          };
          totalValid++;
          totalScore += Number(r.marks ?? r.rawScore ?? 0);
        } else {
          scores[col.examId] = null;
        }
      }
      const average = totalValid > 0 ? Math.round((totalScore / totalValid) * 100) / 100 : null;
      const gi2 = average !== null ? resolveGrade(average) : null;
      return {
        studentId: student.id,
        studentName: student.username,
        studentUserId: student.userId,
        scores,
        average,
        letterGrade: gi2?.letter || null,
        gradePoint: gi2?.point || null
      };
    }).sort((a: any, b: any) => (a.studentName || '').localeCompare(b.studentName || ''));

    return { classId, className: cls?.name, academicYearId: cls?.academicYear?.id, columns, rows };
  },
};

export default academicEngine;
