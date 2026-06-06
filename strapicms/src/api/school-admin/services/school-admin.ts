/**
 * school-admin service
 * Replicates all AdminService + AdminMaterialService logic from Spring Boot
 */

import { generateUserId } from '../utils/userId';

export default () => ({

  // ─── User Management ─────────────────────────────────────────────

  async getAllUsers(role?: string) {
    const filters: any = {};
    if (role) filters.schoolRole = role.toUpperCase();
    return strapi.entityService.findMany('plugin::users-permissions.user' as any, {
      filters,
      fields: ['id', 'userId', 'username', 'email', 'schoolRole', 'birthDate',
        'birthCountry', 'birthCity', 'address', 'gender', 'phoneNumber', 'createdAt'] as any,
    });
  },

  async createUser(data: any) {
    const userId = data.userId || generateUserId();

    // ── Email uniqueness guard ──────────────────────────────────────────────
    if (data.email) {
      const existing = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
        filters: { email: data.email.trim().toLowerCase() } as any,
      }) as any[];
      if (existing.length > 0) {
        const err: any = new Error(
          `Email "${data.email}" is already registered. Each user must have a unique email address.`
        );
        err.status = 400;
        err.name = 'DuplicateEmailError';
        throw err;
      }
    }

    const defaultRoles = await strapi.entityService.findMany('plugin::users-permissions.role' as any, {
      filters: { type: 'authenticated' },
    }) as any[];

    // Map frontend Next.js payload to Strapi schema
    const username = data.name || data.username || `user_${Date.now()}`;
    const schoolRole = data.role || data.schoolRole || 'STUDENT';

    // Remove the frontend 'name' and 'role' fields to prevent DB conflict
    const cleanData = { ...data };
    delete cleanData.name;
    delete cleanData.role;

    // Provide plain-text password; Strapi's users-permissions beforeCreate hook hashes it automatically!
    return await strapi.entityService.create('plugin::users-permissions.user' as any, {
      data: {
        ...cleanData,
        email: data.email.trim().toLowerCase(),  // normalise to lowercase
        username,
        schoolRole,
        userId,
        password: data.password,
        provider: 'local',
        role: defaultRoles[0]?.id,
        confirmed: true,
      },
    });
  },

  async bulkCreateUsers(users: any[]) {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const u of users) {
      try {
        const existing = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
          filters: { email: u.email } as any,
        });
        if ((existing as any[]).length > 0) { skipped++; continue; }
        await this.createUser(u);
        imported++;
      } catch (e: any) {
        errors.push(u.email + ': ' + e.message);
        skipped++;
      }
    }
    return { imported, skipped, errors };
  },

  async updateUser(id: number, data: any) {
    const cleanData = { ...data };
    const username = data.name || data.username;
    if (username) cleanData.username = username;
    const schoolRole = data.role || data.schoolRole;
    if (schoolRole) cleanData.schoolRole = schoolRole;

    delete cleanData.name;
    delete cleanData.role;

    // Strapi's beforeUpdate hook automatically hashes cleanData.password if present

    return strapi.entityService.update('plugin::users-permissions.user' as any, id, { data: cleanData });
  },

  async deleteUser(id: number) {
    return strapi.entityService.delete('plugin::users-permissions.user', id);
  },

  // ─── Class Management ─────────────────────────────────────────────

  async getAllClasses() {
    return strapi.entityService.findMany('api::school-class.school-class', {
      populate: ['teachers', 'students'],
    });
  },

  async createClass(data: any) {
    return strapi.entityService.create('api::school-class.school-class', { data });
  },

  async updateClass(id: number, data: any) {
    return strapi.entityService.update('api::school-class.school-class', id, { data });
  },

  async deleteClass(id: number) {
    return strapi.entityService.delete('api::school-class.school-class', id);
  },

  async assignTeacherToClass(teacherId: number, classId: number) {
    const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
      populate: ['teachers'],
    }) as any;
    const existingTeacherIds = (cls.teachers || []).map((t: any) => t.id);
    if (!existingTeacherIds.includes(teacherId)) {
      await strapi.entityService.update('api::school-class.school-class' as any, classId, {
        data: { teachers: { connect: [{ id: teacherId }] } as any },
      });
    }
  },

  async assignStudentToClass(studentId: number, classId: number) {
    const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
      populate: ['students'],
    }) as any;
    const existingStudentIds = (cls.students || []).map((s: any) => s.id);
    if (!existingStudentIds.includes(studentId)) {
      await strapi.entityService.update('api::school-class.school-class' as any, classId, {
        data: { students: { connect: [{ id: studentId }] } as any },
      });
    }
  },

  async getClassesForStudent(studentId: number) {
    return strapi.entityService.findMany('api::school-class.school-class', {
      filters: { students: { id: studentId } },
      populate: ['teachers', 'students'],
    });
  },

  // ─── Subject Management ───────────────────────────────────────────

  async getAllSubjects() {
    return strapi.entityService.findMany('api::subject.subject');
  },

  async createSubject(data: any) {
    return strapi.entityService.create('api::subject.subject', { data });
  },

  async updateSubject(id: number, data: any) {
    return strapi.entityService.update('api::subject.subject', id, { data });
  },

  async deleteSubject(id: number) {
    return strapi.entityService.delete('api::subject.subject', id);
  },

  // ─── Learning Materials ───────────────────────────────────────────

  async getAllMaterials() {
    return strapi.entityService.findMany('api::learning-material.learning-material', {
      populate: ['classe', 'subject', 'uploadedBy', 'file'],
    });
  },

  async createMaterial(data: any) {
    const payload = {
      ...data,
      classe: data.classe?.id || data.classe,
      subject: data.subject?.id || data.subject,
    };
    return strapi.entityService.create('api::learning-material.learning-material', { data: payload });
  },

  async deleteMaterial(id: number) {
    return strapi.entityService.delete('api::learning-material.learning-material', id);
  },

  async getMaterialAnalytics() {
    const classes = await strapi.entityService.findMany('api::school-class.school-class') as any[];
    const materials = await strapi.entityService.findMany('api::learning-material.learning-material', { populate: ['classe'] }) as any[];

    return classes.map(c => {
      const count = materials.filter(m => m.classe?.id === c.id).length;
      return { className: c.name, downloads: count };
    });
  },

  // ─── Timetable Management ─────────────────────────────────────────

  async getAllTimetables() {
    return strapi.entityService.findMany('api::timetable-entry.timetable-entry', {
      populate: ['classe', 'subject'],
    });
  },

  async createTimetable(data: any) {
    const classeId = data.classe?.id || (typeof data.classe === 'number' ? data.classe : null);
    const subjectId = data.subject?.id || (typeof data.subject === 'number' ? data.subject : null);
    return strapi.entityService.create('api::timetable-entry.timetable-entry', {
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        ...(classeId ? { classe: { connect: [{ id: classeId }] } } : {}),
        ...(subjectId ? { subject: { connect: [{ id: subjectId }] } } : {}),
      } as any,
    });
  },

  async updateTimetable(id: number, data: any) {
    const classeId = data.classe?.id || (typeof data.classe === 'number' ? data.classe : null);
    const subjectId = data.subject?.id || (typeof data.subject === 'number' ? data.subject : null);
    return strapi.entityService.update('api::timetable-entry.timetable-entry', id, {
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        ...(classeId ? { classe: { connect: [{ id: classeId }] } } : {}),
        ...(subjectId ? { subject: { connect: [{ id: subjectId }] } } : {}),
      } as any,
    });
  },

  async deleteTimetable(id: number) {
    return strapi.entityService.delete('api::timetable-entry.timetable-entry', id);
  },

  // ─── Exam Management ──────────────────────────────────────────────

  async getExams(filters: { teacherId?: number; classId?: number }) {
    const f: any = {};
    if (filters.teacherId) f.teacher = { id: filters.teacherId };
    if (filters.classId) f.classe = { id: filters.classId };
    return strapi.entityService.findMany('api::school-exam.school-exam', {
      filters: f,
      populate: ['classe', 'teacher', 'subject'],
    });
  },

  async lockAllExamsInSemester(semester: string) {
    const exams = await strapi.entityService.findMany('api::school-exam.school-exam', {
      filters: { semester },
    }) as any[];

    await Promise.all(exams.map((e) =>
      strapi.entityService.update('api::school-exam.school-exam', e.id, {
        data: { locked: true, closed: true },
      })
    ));
  },

  // ─── Results & GPA ────────────────────────────────────────────────

  async filterResultsForAdmin(studentQuery?: string, classId?: number) {
    const filters: any = {};
    if (classId) filters.exam = { classe: { id: classId } };

    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters,
      populate: ['exam', 'exam.classe', 'exam.subject', 'student'],
    }) as any[];

    if (studentQuery) {
      const q = studentQuery.toLowerCase();
      return results.filter((r) =>
        r.student?.username?.toLowerCase().includes(q) ||
        r.student?.email?.toLowerCase().includes(q) ||
        r.student?.userId?.toLowerCase().includes(q)
      );
    }
    return results;
  },

  async calculateSemesterGPA(studentId: number, semester: string) {
    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { student: { id: studentId }, exam: { semester }, status: 'SUBMITTED' },
      populate: ['exam'],
    }) as any[];

    if (!results.length) return { studentId, semester, gpa: 0, totalCredits: 0, results: [] };

    let totalWeightedMarks = 0;
    let totalWeight = 0;
    for (const r of results) {
      const weight = r.exam?.weight || 1;
      totalWeightedMarks += (r.marks || 0) * weight;
      totalWeight += weight;
    }

    const gpa = totalWeight > 0 ? (totalWeightedMarks / totalWeight / 25) : 0; // scale to 4.0

    return {
      studentId,
      semester,
      gpa: Math.min(4.0, parseFloat(gpa.toFixed(2))),
      totalCredits: totalWeight,
      results: results.map((r) => ({
        examId: r.exam?.id,
        examName: r.exam?.name,
        marks: r.marks,
        letterGrade: r.letterGrade,
        weight: r.exam?.weight,
      })),
    };
  },

  async lockSemesterResults(semester: string) {
    await this.lockAllExamsInSemester(semester);
    // Also mark all submitted results as graded
    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { exam: { semester }, status: 'SUBMITTED' },
    }) as any[];

    await Promise.all(results.map((r) =>
      strapi.entityService.update('api::exam-result.exam-result', r.id, {
        data: { status: 'GRADED' },
      })
    ));
  },

  // ─── Summary Report ───────────────────────────────────────────────

  async getSummaryReport() {
    const [students, teachers, admins, classes, subjects, exams] = await Promise.all([
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'STUDENT' },
      }),
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'TEACHER' },
      }),
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'ADMIN' },
      }),
      strapi.entityService.findMany('api::school-class.school-class'),
      strapi.entityService.findMany('api::subject.subject'),
      strapi.entityService.findMany('api::school-exam.school-exam'),
    ]);

    return {
      totalStudents: (students as any[]).length,
      totalTeachers: (teachers as any[]).length,
      totalAdmins: (admins as any[]).length,
      totalClasses: (classes as any[]).length,
      totalSubjects: (subjects as any[]).length,
      totalExams: (exams as any[]).length,
    };
  },

  // ─── Profile & Password ───────────────────────────────────────────

  async updateProfile(userId: number, payload: Record<string, string>) {
    return strapi.entityService.update('plugin::users-permissions.user', userId, {
      data: {
        username: payload.name || payload.username,
        email: payload.email,
        birthDate: payload.birthDate,
        birthCountry: payload.birthCountry,
        birthCity: payload.birthCity,
        address: payload.address,
        gender: payload.gender as any,
        phoneNumber: payload.phoneNumber,
      },
    });
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId) as any;
    const isMatch = await strapi.plugin('users-permissions')
      .service('user').validatePassword(currentPassword, user.password);

    if (!isMatch) throw new Error('Le mot de passe actuel est incorrect');

    const hashed = await strapi.plugin('users-permissions')
      .service('user').hashPassword({ password: newPassword });

    await strapi.entityService.update('plugin::users-permissions.user' as any, userId, {
      data: { password: hashed } as any,
    });
  },

  async getStudentTranscript(studentId: number, filters: {
    academicYearId?: number;
    classId?: number;
    semesterIds?: number[];
    termIds?: number[];
  }) {
    // 1. Fetch Student details
    const student = await strapi.entityService.findOne('plugin::users-permissions.user' as any, studentId, {
      fields: ['id', 'userId', 'username', 'email', 'birthDate', 'phoneNumber'] as any,
      populate: ['enrolledClasses'] as any
    }) as any;
    if (!student) throw new Error('Etudiant non trouvé');

    // 2. Fetch School / Institutional Details (Contact Info + Navbar)
    let schoolInfo = { name: '2CS COMPEXES', address: '', email: '', phone: '' };
    try {
      const contactInfo = await strapi.entityService.findMany('api::contact-info.contact-info' as any, {
        populate: ['phones', 'email'] as any
      }) as any;

      const realContact = Array.isArray(contactInfo) ? contactInfo[0] : contactInfo;
      if (realContact) {
        schoolInfo.address = realContact.address || '';
        schoolInfo.phone = realContact.phones?.[0]?.phones || '';
        schoolInfo.email = realContact.email?.[0]?.address || '';
      }

      const navbar = await strapi.entityService.findMany('api::navbar.navbar' as any) as any;
      const realNavbar = Array.isArray(navbar) ? navbar[0] : navbar;
      if (realNavbar) {
        schoolInfo.name = realNavbar.title || schoolInfo.name;
      }
    } catch (e) {
      // Ignore if not found, fall back
    }

    // 3. Query Exam Results
    const queryFilters: any = {
      student: { id: studentId },
      status: { $in: ['SUBMITTED', 'GRADED'] }
    };

    const examFilters: any = {};
    if (filters.academicYearId) examFilters.academicYear = { id: filters.academicYearId };
    if (filters.classId) examFilters.classe = { id: filters.classId };
    if (filters.semesterIds && filters.semesterIds.length > 0) examFilters.semesterRel = { id: { $in: filters.semesterIds } };
    if (filters.termIds && filters.termIds.length > 0) examFilters.termRel = { id: { $in: filters.termIds } };

    if (Object.keys(examFilters).length > 0) {
      queryFilters.exam = examFilters;
    }

    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: queryFilters,
      populate: {
        exam: {
          populate: ['subject', 'classe', 'academicYear', 'semesterRel', 'termRel']
        }
      } as any
    }) as any[];

    // 4. Map results
    const transcriptResults = results.map(r => ({
      id: r.id,
      examId: r.exam?.id,
      examName: r.exam?.name,
      subjectCode: r.exam?.subject?.code,
      subjectName: r.exam?.subject?.name || 'N/A',
      className: r.exam?.classe?.name || 'N/A',
      academicYear: r.exam?.academicYear?.name || r.exam?.academicYear?.year || 'N/A',
      semester: r.exam?.semesterRel?.name || r.exam?.semester || 'N/A',
      term: r.exam?.termRel?.name || r.exam?.term || 'N/A',
      marks: r.marks,
      letterGrade: r.letterGrade,
      weight: r.exam?.weight || 0,
      remarks: r.remarks || ''
    }));

    // 5. Calculate GPA and Average
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let totalScore = 0;
    let scoreCount = 0;

    for (const r of transcriptResults) {
      if (r.marks != null) {
        totalWeightedScore += r.marks * (r.weight || 1);
        totalWeight += (r.weight || 1);
        totalScore += r.marks;
        scoreCount++;
      }
    }

    const averageScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(2) : '0.00';
    const weightedAverageScore = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : '0.00';

    // standard GPA mapping on a 4.0 scale
    // AA/A: 4.0, BA/A-: 3.7, BB/B+: 3.3, B: 3.0, CB/B-: 2.7, CC/C+: 2.3, C: 2.0, DC/D: 1.0, FF/F: 0.0
    const scoreToGPA = (score: number) => {
      if (score >= 90) return 4.0;
      if (score >= 85) return 3.7;
      if (score >= 80) return 3.3;
      if (score >= 75) return 3.0;
      if (score >= 70) return 2.7;
      if (score >= 65) return 2.3;
      if (score >= 60) return 2.0;
      if (score >= 50) return 1.0;
      return 0.0;
    };

    let totalGPA = 0;
    let gpaCount = 0;
    for (const r of transcriptResults) {
      if (r.marks != null) {
        totalGPA += scoreToGPA(r.marks);
        gpaCount++;
      }
    }
    const gpa = gpaCount > 0 ? (totalGPA / gpaCount).toFixed(2) : '0.00';

    // Save/Update in DB dynamically to register the official transcript
    const sortedSemesterIds = (filters.semesterIds || []).slice().sort((a, b) => a - b).join(',');
    const sortedTermIds = (filters.termIds || []).slice().sort((a, b) => a - b).join(',');
    const crypto = require('crypto');
    const hashInput = `${studentId}-${filters.academicYearId || 'all'}-${filters.classId || 'all'}-${sortedSemesterIds}-${sortedTermIds}`;
    const hash = crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 8).toUpperCase();
    const referenceNumber = `TR-${student.userId || student.id}-${hash}`;
    const generationDate = new Date().toISOString(); // ISO datetime
    const friendlyDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    try {
      const existing = await strapi.entityService.findMany('api::transcript.transcript' as any, {
        filters: { referenceNumber }
      }) as any[];

      const transcriptPayload: any = {
        referenceNumber,
        generationDate,
        gpa: parseFloat(gpa),
        averageScore: parseFloat(weightedAverageScore),
        student: studentId,
        academicYear: filters.academicYearId || null,
        class: filters.classId || null,
        semesters: filters.semesterIds || [],
        terms: filters.termIds || []
      };

      if (existing.length > 0) {
        await strapi.entityService.update('api::transcript.transcript' as any, existing[0].id, {
          data: transcriptPayload as any
        });
      } else {
        await strapi.entityService.create('api::transcript.transcript' as any, {
          data: transcriptPayload as any
        });
      }
    } catch (dbError) {
      strapi.log.error('Failed to save transcript to registry database:', dbError);
    }

    return {
      student: {
        id: student.id,
        userId: student.userId,
        name: student.username,
        email: student.email,
        birthDate: student.birthDate,
        phoneNumber: student.phoneNumber,
        classes: (student.enrolledClasses || []).map((c: any) => c.name)
      },
      school: schoolInfo,
      results: transcriptResults,
      summary: {
        averageScore: parseFloat(averageScore),
        weightedAverageScore: parseFloat(weightedAverageScore),
        gpa: parseFloat(gpa),
        totalSubjectsCount: scoreCount
      },
      metadata: {
        referenceNumber,
        generationDate: friendlyDate,
        academicYears: Array.from(new Set(transcriptResults.map(r => r.academicYear))),
        semesters: Array.from(new Set(transcriptResults.map(r => r.semester))),
        terms: Array.from(new Set(transcriptResults.map(r => r.term)))
      }
    };
  },

  // ─── Attendance (Admin) ──────────────────────────────────────────────────

  async getAttendanceSessions({ classId, date }: { classId?: number; date?: string }) {
    const filters: any = {};
    if (classId) filters.classe = { id: classId };
    if (date) filters.date = date;

    const sessions = await (strapi.entityService.findMany as any)('api::attendance-session.attendance-session', {
      filters,
      populate: ['classe', 'subject', 'records', 'records.student'],
      sort: [{ date: 'desc' }],
    }) as any[];

    return sessions.map((s) => {
      const records = s.records || [];
      const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
      const lateCount = records.filter((r: any) => r.status === 'LATE').length;
      return {
        id: s.id,
        date: s.date,
        sessionTime: s.sessionTime || null,
        subjectName: s.subject?.name || null,
        notes: s.notes || null,
        className: s.classe?.name || 'N/A',
        classId: s.classe?.id,
        totalCount: records.length,
        presentCount,
        lateCount,
        absentCount: records.filter((r: any) => r.status === 'ABSENT').length,
        excusedCount: records.filter((r: any) => r.status === 'EXCUSED' || r.status === 'SICK').length,
        attendanceRate: records.length > 0
          ? Math.round(((presentCount + lateCount) / records.length) * 100)
          : 0,
        records: records.map((r: any) => ({
          studentId: r.student?.id,
          studentName: r.student?.username || r.student?.name,
          userId: r.student?.userId,
          status: r.status,
        })),
      };
    });
  },

  async getAttendanceAnalytics() {
    const records = await strapi.entityService.findMany('api::attendance-record.attendance-record' as any, {
      populate: ['student', 'session', 'session.classe'],
    }) as any[];

    const totalRecords = records.length;
    const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r: any) => r.status === 'LATE').length;
    const excusedCount = records.filter((r: any) => r.status === 'EXCUSED' || r.status === 'SICK').length;
    const overallRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0;

    // Per-class breakdown
    const classMap = new Map<string, { name: string; total: number; present: number; late: number }>();
    for (const r of records) {
      const clsName = r.session?.classe?.name || 'Unknown';
      if (!classMap.has(clsName)) classMap.set(clsName, { name: clsName, total: 0, present: 0, late: 0 });
      const entry = classMap.get(clsName)!;
      entry.total++;
      if (r.status === 'PRESENT') entry.present++;
      if (r.status === 'LATE') entry.late++;
    }

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      overallRate,
      byClass: Array.from(classMap.values()).map(c => ({
        ...c,
        rate: c.total > 0 ? Math.round(((c.present + c.late) / c.total) * 100) : 0,
      })),
    };
  },

  async deleteAttendanceSession(sessionId: number) {
    // Cascade delete all records first
    const records = await strapi.entityService.findMany('api::attendance-record.attendance-record', {
      filters: { session: { id: sessionId } },
    }) as any[];
    await Promise.all(records.map((r: any) =>
      strapi.entityService.delete('api::attendance-record.attendance-record', r.id)
    ));
    return strapi.entityService.delete('api::attendance-session.attendance-session', sessionId);
  },
});
