/**
 * school-teacher service
 * Replicates all TeacherService + TeacherMaterialService logic from Spring Boot
 */

export default () => ({

  // ─── Classes & Students ───────────────────────────────────────────

  async getClassesByTeacher(teacherId: number) {
    return strapi.entityService.findMany('api::school-class.school-class' as any, {
      filters: { teachers: { id: teacherId } },
      populate: ['teachers', 'students'] as any,
    });
  },

  async getStudentsByClass(teacherId: number, classId: number) {
    const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
      populate: ['teachers', 'students'],
    }) as any;

    // Verify this teacher belongs to this class
    const isTeacher = (cls.teachers || []).some((t: any) => t.id === teacherId);
    if (!isTeacher) throw new Error('Unauthorized: not your class');

    return cls.students || [];
  },

  async getStudentsByTeacher(teacherId: number) {
    const classes = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: { teachers: { id: teacherId } },
      populate: ['students'],
    }) as any[];

    const studentsMap = new Map<number, any>();
    for (const cls of classes) {
      for (const s of cls.students || []) {
        studentsMap.set(s.id, s);
      }
    }
    return Array.from(studentsMap.values());
  },

  // ─── Attendance ───────────────────────────────────────────────────

  async submitAttendance(dto: {
    classId: number;
    date: string;
    sessionTime?: string;
    subjectId?: number;
    notes?: string;
    records: Array<{ studentId: number; status: string }>;
  }) {
    const sessionData: any = {
      date: dto.date,
      classe: dto.classId,
    };
    if (dto.sessionTime) sessionData.sessionTime = dto.sessionTime;
    if (dto.subjectId)   sessionData.subject = dto.subjectId;
    if (dto.notes)       sessionData.notes = dto.notes;

    const session = await strapi.entityService.create('api::attendance-session.attendance-session', {
      data: sessionData,
    }) as any;

    await Promise.all(dto.records.map((r) =>
      strapi.entityService.create('api::attendance-record.attendance-record' as any, {
        data: {
          status: r.status as any,
          student: r.studentId,
          session: session.id,
        },
      })
    ));
  },

  async updateAttendance(sessionId: number, dto: {
    date?: string;
    sessionTime?: string;
    subjectId?: number;
    notes?: string;
    records: Array<{ studentId: number; status: string }>;
  }) {
    // Update session metadata if provided
    const sessionUpdate: any = {};
    if (dto.date)        sessionUpdate.date = dto.date;
    if (dto.sessionTime) sessionUpdate.sessionTime = dto.sessionTime;
    if (dto.subjectId)   sessionUpdate.subject = dto.subjectId;
    // Always update notes (could be clearing it)
    sessionUpdate.notes = dto.notes || null;
    if (Object.keys(sessionUpdate).length > 0) {
      await strapi.entityService.update('api::attendance-session.attendance-session', sessionId, {
        data: sessionUpdate,
      });
    }

    // Delete old records and recreate with new statuses
    const oldRecords = await strapi.entityService.findMany('api::attendance-record.attendance-record', {
      filters: { session: { id: sessionId } },
    }) as any[];

    await Promise.all(oldRecords.map((r) =>
      strapi.entityService.delete('api::attendance-record.attendance-record', r.id)
    ));

    await Promise.all(dto.records.map((r) =>
      strapi.entityService.create('api::attendance-record.attendance-record' as any, {
        data: {
          status: r.status as any,
          student: r.studentId,
          session: sessionId,
        },
      })
    ));
  },

  async getAttendanceHistory(classId: number) {
    const sessions = await (strapi.entityService.findMany as any)('api::attendance-session.attendance-session', {
      filters: { classe: { id: classId } },
      populate: ['records', 'records.student', 'subject'],
      sort: [{ date: 'desc' }],
    }) as any[];

    return sessions.map((s) => {
      const records     = s.records || [];
      const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
      const lateCount    = records.filter((r: any) => r.status === 'LATE').length;
      const totalCount   = records.length;
      return {
        id:           s.id,
        date:         s.date,
        sessionTime:  s.sessionTime || null,
        subjectName:  s.subject?.name || null,
        subjectId:    s.subject?.id || null,
        notes:        s.notes || null,
        totalCount,
        presentCount,
        lateCount,
        absentCount:  records.filter((r: any) => r.status === 'ABSENT').length,
        excusedCount: records.filter((r: any) => r.status === 'EXCUSED' || r.status === 'SICK').length,
        records: records.map((r: any) => ({
          studentId:   r.student?.id,
          studentName: r.student?.username || r.student?.name,
          status:      r.status,
        })),
      };
    });
  },

  async getSubjectsByClass(_teacherId: number, _classId: number) {
    // Return all subjects — simple and always works regardless of exam assignments.
    // The frontend labels these as the teacher's subjects since subjects are school-wide.
    const allSubjects = await (strapi.entityService.findMany as any)('api::subject.subject', {
      sort: [{ name: 'asc' }],
    }) as any[];
    return allSubjects.map((s: any) => ({ id: s.id, name: s.name, code: s.code || null }));
  },

  // ─── Exams ────────────────────────────────────────────────────────

  async createExam(teacherId: number, data: any) {
    let semesterName = data.semester || '';
    let termName = data.term || '';

    if (data.semesterRel) {
      const sem = await strapi.entityService.findOne('api::semester.semester' as any, data.semesterRel);
      if (sem) semesterName = (sem as any).name;
    }
    if (data.termRel) {
      const trm = await strapi.entityService.findOne('api::term.term' as any, data.termRel);
      if (trm) termName = (trm as any).name;
    }

    const payload = {
      ...data,
      teacher: teacherId,
      classe: data.classe?.id || data.classe,
      subject: data.subject?.id || data.subject,
      semester: semesterName,
      term: termName,
      academicYear: data.academicYear?.id || data.academicYear,
      semesterRel: data.semesterRel?.id || data.semesterRel,
      termRel: data.termRel?.id || data.termRel,
    };
    return strapi.entityService.create('api::school-exam.school-exam', {
      data: payload,
    });
  },

  async getExamsByTeacher(teacherId: number) {
    return strapi.entityService.findMany('api::school-exam.school-exam', {
      filters: { teacher: { id: teacherId } },
      populate: ['classe', 'subject', 'academicYear', 'semesterRel', 'termRel'] as any,
    });
  },

  async updateExam(examId: number, data: any, teacherId: number) {
    const exam = await strapi.entityService.findOne('api::school-exam.school-exam', examId, { populate: ['teacher'] }) as any;
    if (exam.teacher?.id !== teacherId) throw new Error('Unauthorized');
    if (exam.locked) throw new Error('This exam is locked by admin');

    let semesterName = data.semester || exam.semester;
    let termName = data.term || exam.term;

    if (data.semesterRel) {
      const sem = await strapi.entityService.findOne('api::semester.semester' as any, data.semesterRel);
      if (sem) semesterName = (sem as any).name;
    }
    if (data.termRel) {
      const trm = await strapi.entityService.findOne('api::term.term' as any, data.termRel);
      if (trm) termName = (trm as any).name;
    }
    
    const payload = {
      ...data,
      classe: data.classe?.id || data.classe,
      subject: data.subject?.id || data.subject,
      semester: semesterName,
      term: termName,
      academicYear: data.academicYear?.id || data.academicYear,
      semesterRel: data.semesterRel?.id || data.semesterRel,
      termRel: data.termRel?.id || data.termRel,
    };
    
    return strapi.entityService.update('api::school-exam.school-exam', examId, { data: payload });
  },

  async deleteExam(examId: number, teacherId: number) {
    const exam = await strapi.entityService.findOne('api::school-exam.school-exam', examId, { populate: ['teacher'] }) as any;
    if (exam?.teacher?.id !== teacherId) throw new Error('Unauthorized');
    return strapi.entityService.delete('api::school-exam.school-exam', examId);
  },

  async toggleExamStatus(examId: number, closed: boolean) {
    return strapi.entityService.update('api::school-exam.school-exam', examId, {
      data: { closed },
    });
  },

  // ─── Results / Marks ──────────────────────────────────────────────

  async getGradebookByClass(teacherId: number, classId: number) {
    return strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { exam: { classe: { id: classId }, teacher: { id: teacherId } } },
      populate: ['exam', 'exam.subject', 'student'],
    });
  },

  async saveResult(teacherId: number, data: any) {
    const exam = await strapi.entityService.findOne('api::school-exam.school-exam', data.exam?.id || data.examId || data.exam, { populate: ['teacher'] }) as any;
    if (exam?.teacher?.id !== teacherId) throw new Error('Unauthorized');

    const letterGrade = _computeLetterGrade(data.marks);
    const payload = {
      ...data,
      exam: data.exam?.id || data.exam,
      student: data.student?.id || data.student,
      letterGrade,
      status: 'DRAFT'
    };
    return await strapi.entityService.create('api::exam-result.exam-result', {
      data: payload,
    });
  },

  async updateResult(resultId: number, data: any) {
    const letterGrade = _computeLetterGrade(data.marks);
    const payload = {
      ...data,
      exam: data.exam?.id || data.exam,
      student: data.student?.id || data.student,
      letterGrade
    };
    return strapi.entityService.update('api::exam-result.exam-result', resultId, {
      data: payload,
    });
  },

  async saveBulkResults(teacherId: number, results: any[]) {
    await Promise.all(results.map((r) => {
      const letterGrade = _computeLetterGrade(r.marks);
      const payload = {
        ...r,
        exam: r.exam?.id || r.exam,
        student: r.student?.id || r.student,
        letterGrade
      };
      if (r.id) {
        return strapi.entityService.update('api::exam-result.exam-result', r.id, {
          data: payload,
        });
      }
      return strapi.entityService.create('api::exam-result.exam-result', {
        data: { ...payload, status: 'DRAFT' },
      });
    }));
  },

  async submitResults(resultIds: number[]) {
    await Promise.all(resultIds.map((id) =>
      strapi.entityService.update('api::exam-result.exam-result', id, {
        data: { status: 'SUBMITTED' },
      })
    ));
  },

  async getResultsByTeacher(teacherId: number) {
    return strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { exam: { teacher: { id: teacherId } } },
      populate: ['exam', 'exam.subject', 'exam.classe', 'student'],
    });
  },

  async filterResults(classId?: number, studentId?: string) {
    const filters: any = {};
    if (classId) filters.exam = { ...filters.exam, classe: { id: classId } };

    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters,
      populate: ['exam', 'exam.subject', 'exam.classe', 'student'],
    }) as any[];

    if (studentId) {
      const q = studentId.toLowerCase();
      return results.filter((r) =>
        r.student?.userId?.toLowerCase() === q ||
        r.student?.username?.toLowerCase().includes(q)
      );
    }
    return results;
  },

  async submitMarks(dto: { examId: number; studentId: number; marks: number }) {
    const letterGrade = _computeLetterGrade(dto.marks);
    return strapi.entityService.create('api::exam-result.exam-result', {
      data: {
        exam: dto.examId,
        student: dto.studentId,
        marks: dto.marks,
        letterGrade,
        status: 'SUBMITTED',
      },
    });
  },

  // ─── Timetable ────────────────────────────────────────────────────

  async getTeacherTimetable(teacherId: number) {
    const classes = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: { teachers: { id: teacherId } },
    }) as any[];

    const classIds = classes.map((c) => c.id);
    if (!classIds.length) return [];

    return strapi.entityService.findMany('api::timetable-entry.timetable-entry', {
      filters: { classe: { id: { $in: classIds } } },
      populate: ['classe', 'subject'],
      sort: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  },

  async getAllSubjects() {
    return strapi.entityService.findMany('api::subject.subject');
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
    if (!isMatch) throw new Error('Current password is incorrect');

    const hashed = await strapi.plugin('users-permissions')
      .service('user').hashPassword({ password: newPassword });

    await strapi.entityService.update('plugin::users-permissions.user' as any, userId, {
      data: { password: hashed } as any,
    });
  },

  async getTeacherMaterials(teacherId: number) {
    const materials = await strapi.entityService.findMany('api::learning-material.learning-material', {
      filters: { uploadedBy: { id: teacherId } },
      populate: ['classe', 'file'],
    }) as any[];
    
    const grouped = new Map<string, any>();

    for (const mat of materials) {
      if (!grouped.has(mat.title)) {
         grouped.set(mat.title, {
            ...mat,
            targetClasses: mat.classe ? [mat.classe] : [],
            fileUrl: mat.file?.url || mat.fileUrl,
            fileName: mat.file?.name,
            fileSize: mat.file?.size ? mat.file.size * 1024 : 0,
         });
      } else {
         if (mat.classe) grouped.get(mat.title).targetClasses.push(mat.classe);
      }
    }
    return Array.from(grouped.values()).sort((a,b) => b.id - a.id);
  },

  async uploadTeacherMaterial(teacherId: number, body: any, files: any) {
    const { title, description, classIds } = body;
    let targetClasses: number[] = [];
    if (classIds) {
      if (Array.isArray(classIds)) targetClasses = classIds.map(Number);
      else targetClasses = [Number(classIds)];
    }

    let fileId: number | null = null;
    let fileUrl: string | null = null;
    
    if (files && files.file) {
      const uploadedFile = await strapi.plugin('upload').service('upload').upload({
        data: { fileInfo: { name: files.file.name } },
        files: files.file,
      });
      if (uploadedFile && uploadedFile.length > 0) {
        fileId = uploadedFile[0].id;
        fileUrl = uploadedFile[0].url;
      }
    }

    const createdRecordPayload = {
      title,
      description,
      fileUrl,
      file: fileId || null,
      uploadedBy: teacherId
    };

    if (targetClasses.length === 0) {
       return await strapi.entityService.create('api::learning-material.learning-material', {
         data: createdRecordPayload
       });
    }

    const createdMaterials = await Promise.all(targetClasses.map(classId => {
       return strapi.entityService.create('api::learning-material.learning-material', {
         data: { ...createdRecordPayload, classe: classId }
       });
    }));

    return createdMaterials[0];
  },

  async deleteTeacherMaterial(teacherId: number, materialId: number) {
    const mat = await strapi.entityService.findOne('api::learning-material.learning-material', materialId, { populate: ['uploadedBy'] }) as any;
    if (!mat || mat.uploadedBy?.id !== teacherId) return;

    const relatedMats = await strapi.entityService.findMany('api::learning-material.learning-material', {
       filters: { uploadedBy: { id: teacherId }, title: mat.title }
    }) as any[];
    
    await Promise.all(relatedMats.map(r => strapi.entityService.delete('api::learning-material.learning-material', r.id)));
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _computeLetterGrade(marks: number): string {
  if (marks >= 90) return 'A';
  if (marks >= 87) return 'A-';
  if (marks >= 83) return 'B+';
  if (marks >= 80) return 'B';
  if (marks >= 77) return 'B-';
  if (marks >= 73) return 'C+';
  if (marks >= 70) return 'C';
  if (marks >= 60) return 'D';
  return 'F';
}
