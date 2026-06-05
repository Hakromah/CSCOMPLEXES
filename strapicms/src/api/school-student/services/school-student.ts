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
    return strapi.entityService.findMany('api::school-class.school-class', {
      filters: { students: { id: studentId } },
      populate: ['teachers', 'students'],
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
      date:        r.session?.date,
      sessionTime: r.session?.sessionTime || null,
      className:   r.session?.classe?.name || null,
      subjectName: r.session?.subject?.name || null,
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
      populate: ['classe', 'subject'],
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
    // 1. Fetch Classes First to map related materials/exams
    const classes = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: { students: { id: studentId } },
    }) as any[];
    const classIds = classes.map(c => c.id);

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
      courseCount: classes.length,
      attendance,
      materials: materials.length,
      averageGrade,
      upcomingExam,
      recentActivity: recentActivity.slice(0, 3)
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
