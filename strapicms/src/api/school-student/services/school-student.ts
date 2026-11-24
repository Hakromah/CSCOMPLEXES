/**
 * school-student service
 * Replicates all StudentService logic from Spring Boot
 */

export default () => ({

  // ─── Profile ──────────────────────────────────────────────────────

  async getStudentProfile(email: string) {
    const users = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
      filters: { email } as any,
      populate: ['role'] as any,
    }) as any[];
    if (!users.length) throw new Error('Student not found');
    const u = users[0];
    return {
      id: u.id,
      userId: u.userId,
      name: u.username,
      email: u.email,
      role: u.schoolRole,
      birthDate: u.birthDate,
      birthCountry: u.birthCountry,
      birthCity: u.birthCity,
      address: u.address,
      gender: u.gender,
      phoneNumber: u.phoneNumber,
      createdAt: u.createdAt,
    };
  },

  async updateProfile(email: string, dto: any) {
    const users = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
      filters: { email } as any,
    }) as any[];
    if (!users.length) throw new Error('Student not found');
    const u = users[0];
    const updated = await strapi.entityService.update('plugin::users-permissions.user', u.id, {
      data: {
        username: dto.name || dto.username,
        email: dto.email,
        birthDate: dto.birthDate,
        birthCountry: dto.birthCountry,
        birthCity: dto.birthCity,
        address: dto.address,
        gender: dto.gender,
        phoneNumber: dto.phoneNumber,
      },
    }) as any;
    return this.getStudentProfile(updated.email);
  },

  async changePassword(email: string, currentPassword: string, newPassword: string) {
    const users = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
      filters: { email } as any,
    }) as any[];
    if (!users.length) throw new Error('Student not found');
    const user = users[0];

    const isMatch = await strapi.plugin('users-permissions')
      .service('user').validatePassword(currentPassword, user.password);
    if (!isMatch) throw new Error('Current password is incorrect');

    const hashed = await strapi.plugin('users-permissions')
      .service('user').hashPassword({ password: newPassword });
    await strapi.entityService.update('plugin::users-permissions.user' as any, user.id, {
      data: { password: hashed } as any,
    });
  },

  // ─── Classes ──────────────────────────────────────────────────────

  async getClassesByStudent(studentId: number) {
    const classes = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: { students: { id: studentId } },
      populate: ['teachers', 'students', 'academicYear'],
    }) as any[];

    const classIds = (classes || []).map((c: any) => c.id);
    if (!classIds.length) return [];

    let assignments: any[] = [];
    try {
      assignments = await (strapi.entityService.findMany as any)('api::teacher-assignment.teacher-assignment', {
        filters: { classe: { id: { $in: classIds } } },
        populate: ['teacher', 'classe', 'subjects'],
      }) as any[];
    } catch {
      assignments = [];
    }

    let ttEntries: any[] = [];
    try {
      ttEntries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
        filters: { classe: { id: { $in: classIds } } },
        populate: ['teacher', 'classe', 'subject'],
      }) as any[];
    } catch {
      ttEntries = [];
    }

    return (classes || []).map((cls: any) => {
      const teacherMap = new Map<number, {
        teacherId: number;
        teacherName: string;
        teacherEmail: string;
        subjects: Array<{ id: number; name: string; code: string | null }>;
      }>();

      for (const t of cls.teachers || []) {
        const name = t.firstName && t.lastName
          ? `${t.firstName} ${t.lastName}`.trim()
          : (t.username || t.name || t.email);
        teacherMap.set(t.id, {
          teacherId: t.id,
          teacherName: name,
          teacherEmail: t.email || '',
          subjects: [],
        });
      }

      for (const a of (assignments || []).filter((x: any) => x.classe?.id === cls.id)) {
        if (!a.teacher?.id) continue;
        if (!teacherMap.has(a.teacher.id)) {
          const name = a.teacher.firstName && a.teacher.lastName
            ? `${a.teacher.firstName} ${a.teacher.lastName}`.trim()
            : (a.teacher.username || a.teacher.email);
          teacherMap.set(a.teacher.id, {
            teacherId: a.teacher.id,
            teacherName: name,
            teacherEmail: a.teacher.email || '',
            subjects: [],
          });
        }
        const entry = teacherMap.get(a.teacher.id)!;
        for (const s of a.subjects || []) {
          if (s?.id && !entry.subjects.some((x) => x.id === s.id)) {
            entry.subjects.push({ id: s.id, name: s.name, code: s.code || null });
          }
        }
      }

      for (const tt of (ttEntries || []).filter((x: any) => x.classe?.id === cls.id)) {
        if (!tt.teacher?.id || !tt.subject?.id) continue;
        if (!teacherMap.has(tt.teacher.id)) {
          const name = tt.teacher.firstName && tt.teacher.lastName
            ? `${tt.teacher.firstName} ${tt.teacher.lastName}`.trim()
            : (tt.teacher.username || tt.teacher.email);
          teacherMap.set(tt.teacher.id, {
            teacherId: tt.teacher.id,
            teacherName: name,
            teacherEmail: tt.teacher.email || '',
            subjects: [],
          });
        }
        const entry = teacherMap.get(tt.teacher.id)!;
        if (!entry.subjects.some((x) => x.id === tt.subject.id)) {
          entry.subjects.push({ id: tt.subject.id, name: tt.subject.name, code: tt.subject.code || null });
        }
      }

      const teachingAssignments = Array.from(teacherMap.values());
      const subjects = teachingAssignments.flatMap((ta) =>
        ta.subjects.map((s) => ({
          ...s,
          teacherId: ta.teacherId,
          teacherName: ta.teacherName,
        }))
      );

      return {
        ...cls,
        teachingAssignments,
        subjects,
      };
    });
  },

  // ─── Attendance ───────────────────────────────────────────────────

  async getAttendanceByStudent(studentId: number) {
    const rawRecords = await (strapi.entityService.findMany as any)('api::attendance-record.attendance-record', {
      filters: { student: { id: studentId } },
      populate: ['session', 'session.classe', 'session.subject'],
    }) as any[];

    // Sort in memory (avoids SQLite deep-relation sort issues)
    const records = rawRecords.sort((a, b) => {
      const dateA = a.session?.date ? new Date(a.session.date).getTime() : 0;
      const dateB = b.session?.date ? new Date(b.session.date).getTime() : 0;
      return dateB - dateA;
    });

    return records.map((r) => ({
      id:          r.id,
      sessionId:   r.session?.id || null,
      date:        r.session?.date,
      sessionTime: r.session?.sessionTime || null,
      createdAt:   r.session?.createdAt || r.createdAt || null,
      classId:     r.session?.classe?.id || null,
      className:   r.session?.classe?.name || null,
      subjectId:   r.session?.subject?.id || null,
      subjectName: r.session?.subject?.name || null,
      subjectCode: r.session?.subject?.code || null,
      notes:       r.session?.notes || null,
      status:      r.status,
    }));
  },

  // ─── Timetable ────────────────────────────────────────────────────

  async getStudentTimetable(studentId: number) {
    const classes = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: { students: { id: studentId } },
    }) as any[];

    const classIds = classes.map((c) => c.id);
    if (!classIds.length) return [];

    return strapi.entityService.findMany('api::timetable-entry.timetable-entry', {
      filters: { classe: { id: { $in: classIds } } },
      populate: ['classe', 'subject', 'teacher'],
      sort: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  },

  // ─── Exams ────────────────────────────────────────────────────────

  async getExamsForStudent(studentId: number) {
    const classes = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: { students: { id: studentId } },
    }) as any[];

    const classIds = classes.map((c) => c.id);
    if (!classIds.length) return [];

    return strapi.entityService.findMany('api::school-exam.school-exam', {
      filters: { classe: { id: { $in: classIds } } },
      populate: ['subject', 'classe', 'teacher'],
      sort: [{ date: 'asc' }],
    });
  },

  // ─── Results ──────────────────────────────────────────────────────

   async getResultsByStudent(studentId: number) {
    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { student: { id: studentId } },
      populate: ['exam', 'exam.subject', 'exam.classe', 'exam.semesterRel', 'exam.termRel'],
      sort: [{ createdAt: 'desc' }],
    }) as any[];

    return results.map((r) => ({
      id: r.id,
      examName: r.exam?.name,
      subject: r.exam?.subject?.name,
      className: r.exam?.classe?.name,
      semester: r.exam?.semesterRel?.name || r.exam?.semester || 'N/A',
      term: r.exam?.termRel?.name || r.exam?.term || 'N/A',
      marks: r.marks,
      letterGrade: r.letterGrade,
      status: r.status,
      date: r.exam?.date,
    }));
  },

  async getSemesterTranscript(studentId: number, semester: string) {
    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: {
        student: { id: studentId },
        exam: { semester },
        status: { $in: ['SUBMITTED', 'GRADED'] },
      },
      populate: ['exam', 'exam.subject', 'exam.classe', 'exam.semesterRel', 'exam.termRel'],
    }) as any[];

    return results.map((r) => ({
      examId: r.exam?.id,
      examName: r.exam?.name,
      subject: r.exam?.subject?.name,
      className: r.exam?.classe?.name,
      semester: r.exam?.semesterRel?.name || r.exam?.semester || 'N/A',
      term: r.exam?.termRel?.name || r.exam?.term || 'N/A',
      marks: r.marks,
      letterGrade: r.letterGrade,
      weight: r.exam?.weight,
    }));
  },

  // ─── Dashboard Stats ──────────────────────────────────────────────

  async getDashboardStats(studentId: number) {
    // 1. Fetch Enriched Classes (with Teachers & Assigned Subjects)
    const enrichedClasses = await this.getClassesByStudent(studentId);
    const classIds = enrichedClasses.map((c: any) => c.id);

    const courseList = enrichedClasses.flatMap((cls: any) =>
      (cls.subjects || []).map((s: any) => ({
        subjectId: s.id,
        subjectName: s.name,
        subjectCode: s.code || null,
        classId: cls.id,
        className: cls.name,
        teacherId: s.teacherId,
        teacherName: s.teacherName,
      }))
    );

    // 2. Fetch all other aggregates in parallel
    const [attendanceRecords, exams, results, materials] = await Promise.all([
      strapi.entityService.findMany('api::attendance-record.attendance-record', {
        filters: { student: { id: studentId } },
      }) as Promise<any[]>,
      this.getExamsForStudent(studentId),
      strapi.entityService.findMany('api::exam-result.exam-result', {
        filters: { student: { id: studentId }, status: { $in: ['SUBMITTED', 'GRADED'] } },
        populate: ['exam', 'exam.subject'],
        sort: [{ createdAt: 'desc' }],
      }) as Promise<any[]>,
      strapi.entityService.findMany('api::learning-material.learning-material', {
        filters: classIds.length ? { classe: { id: { $in: classIds } } } : { id: -1 },
        populate: ['subject'],
        sort: [{ createdAt: 'desc' }],
      }) as Promise<any[]>,
    ]);

    // Calculate Attendance
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const attendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Calculate Average Grade
    const marks = results.map((r) => r.marks).filter(m => m !== undefined && m !== null);
    const averageGrade = marks.length > 0 
      ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1)
      : 'N/A';

    // Upcoming Exam (closest future exam)
    const now = new Date();
    const upcomingExams = exams.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const upcomingExam = upcomingExams.length > 0 ? {
      name: (upcomingExams[0] as any).name,
      subject: (upcomingExams[0] as any).subject?.name || 'Exam',
      date: (upcomingExams[0] as any).date,
      time: (upcomingExams[0] as any).startTime,
      teacherName: (upcomingExams[0] as any).teacher?.username || (upcomingExams[0] as any).teacher?.name || 'Non assigné',
    } : null;

    // Recent Activity Feed (mix of latest grades and materials)
    const recentActivity = [];
    if (results.length > 0) {
      recentActivity.push({
        title: `Grade Released: ${results[0].exam?.name || 'Exam'}`,
        timestamp: results[0].createdAt,
        type: 'grade'
      });
    }
    if (materials.length > 0) {
      recentActivity.push({
        title: `Material Uploaded: ${materials[0].title}`,
        timestamp: materials[0].createdAt,
        type: 'file'
      });
    }
    // Sort feed by newest first
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      courseCount: courseList.length > 0 ? courseList.length : enrichedClasses.length,
      classCount: enrichedClasses.length,
      attendance,
      materials: materials.length,
      averageGrade,
      upcomingExam,
      recentActivity: recentActivity.slice(0, 3),
      assignedClasses: enrichedClasses.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        subjects: cls.subjects || [],
        teachingAssignments: cls.teachingAssignments || [],
      })),
      courseList,
    };
  },

  // ─── Learning Materials ───────────────────────────────────────────

  async getMaterialsByClass(studentId: number, classId: number) {
    // Security verification: Determine if the authenticated Student is actually in the requested Classroom
    const studentClasses = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: { students: { id: studentId } }
    }) as any[];
    
    if (!studentClasses.some(c => c.id === classId)) {
        return []; // Block access
    }

    const materials = await strapi.entityService.findMany('api::learning-material.learning-material', {
      filters: { classe: { id: classId } },
      populate: ['uploadedBy', 'subject', 'classe'],
      sort: { createdAt: 'desc' } as any,
    }) as any[];

    return materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      fileType: m.fileType,
      createdAt: m.createdAt,
      className: m.classe?.name,
      uploadedBy: {
        id: m.uploadedBy?.id,
        name: m.uploadedBy?.name || m.uploadedBy?.username,
      },
      subject: m.subject?.name,
    }));
  },
});
