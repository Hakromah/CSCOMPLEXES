// timetable-engine.ts - High School Timetable Management & Conflict Resolution Engine
// Handles real-time conflict detection, bulk audits, batch duplication, and workload analytics.

export interface ConflictItem {
  type: 'TEACHER' | 'ROOM' | 'CLASS';
  message: string;
  conflictingEntryId?: number;
  conflictingSubject?: string;
  conflictingClass?: string;
  conflictingTeacher?: string;
  conflictingRoom?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
}

export function timeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h * 60 + m;
}

export function isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

export const timetableEngine = {
  detectConflicts(
    candidate: {
      id?: number;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      classId?: number;
      teacherId?: number;
      roomId?: number;
    },
    allEntries: any[],
    excludeId?: number
  ): { hasConflict: boolean; conflicts: ConflictItem[] } {
    const conflicts: ConflictItem[] = [];
    const targetExcludeId = excludeId || candidate.id;

    for (const entry of allEntries) {
      if (targetExcludeId && entry.id === targetExcludeId) continue;
      if (entry.dayOfWeek !== candidate.dayOfWeek) continue;

      // Check time overlap
      if (!isTimeOverlapping(candidate.startTime, candidate.endTime, entry.startTime, entry.endTime)) {
        continue;
      }

      const entryClassId = entry.classe?.id || entry.classe;
      const entryTeacherId = entry.teacher?.id || entry.teacher;
      const entryRoomId = entry.room?.id || entry.room;

      // 1. Teacher Conflict
      if (candidate.teacherId && entryTeacherId && Number(candidate.teacherId) === Number(entryTeacherId)) {
        const teacherName = entry.teacher?.name || entry.teacher?.username || 'Enseignant';
        const className = entry.classe?.name || 'une autre classe';
        const subName = entry.subject?.name || 'un cours';
        conflicts.push({
          type: 'TEACHER',
          message: `L'enseignant ${teacherName} est déjà programmé pour ${subName} (${className}) de ${entry.startTime?.substring(0,5)} à ${entry.endTime?.substring(0,5)}.`,
          conflictingEntryId: entry.id,
          conflictingSubject: subName,
          conflictingClass: className,
          conflictingTeacher: teacherName,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
        });
      }

      // 2. Room Conflict
      if (candidate.roomId && entryRoomId && Number(candidate.roomId) === Number(entryRoomId)) {
        const roomName = entry.room?.name || entry.roomName || 'cette salle';
        const className = entry.classe?.name || 'une autre classe';
        const subName = entry.subject?.name || 'un cours';
        conflicts.push({
          type: 'ROOM',
          message: `La salle ${roomName} est déjà occupée par ${className} (${subName}) de ${entry.startTime?.substring(0,5)} à ${entry.endTime?.substring(0,5)}.`,
          conflictingEntryId: entry.id,
          conflictingSubject: subName,
          conflictingClass: className,
          conflictingRoom: roomName,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
        });
      }

      // 3. Class Conflict
      if (candidate.classId && entryClassId && Number(candidate.classId) === Number(entryClassId)) {
        const className = entry.classe?.name || 'cette classe';
        const subName = entry.subject?.name || 'un cours';
        conflicts.push({
          type: 'CLASS',
          message: `La classe ${className} a déjà un cours de ${subName} programmé de ${entry.startTime?.substring(0,5)} à ${entry.endTime?.substring(0,5)}.`,
          conflictingEntryId: entry.id,
          conflictingSubject: subName,
          conflictingClass: className,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  },

  async auditTimetable(filters: { academicYearId?: number; semesterId?: number; classId?: number }) {
    const f: any = {};
    if (filters.academicYearId) f.academicYear = { id: filters.academicYearId };
    if (filters.semesterId) f.semester = { id: filters.semesterId };
    if (filters.classId) f.classe = { id: filters.classId };

    const entries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: f,
      populate: ['classe', 'subject', 'teacher', 'room', 'academicYear', 'semester'],
    }) as any[];

    const conflictPairs: Array<{
      entry1: any;
      entry2: any;
      type: 'TEACHER' | 'ROOM' | 'CLASS';
      description: string;
    }> = [];

    const checkedPairs = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const e1 = entries[i];
        const e2 = entries[j];

        if (e1.dayOfWeek !== e2.dayOfWeek) continue;
        if (!isTimeOverlapping(e1.startTime, e1.endTime, e2.startTime, e2.endTime)) continue;

        const pairKey = e1.id < e2.id ? `${e1.id}_${e2.id}` : `${e2.id}_${e1.id}`;
        if (checkedPairs.has(pairKey)) continue;

        // Teacher overlap
        if (e1.teacher?.id && e2.teacher?.id && e1.teacher.id === e2.teacher.id) {
          checkedPairs.add(pairKey);
          conflictPairs.push({
            entry1: e1,
            entry2: e2,
            type: 'TEACHER',
            description: `Enseignant ${e1.teacher.name || e1.teacher.username} programmé simultanément en ${e1.classe?.name || 'Classe 1'} et ${e2.classe?.name || 'Classe 2'} (${e1.dayOfWeek} ${e1.startTime?.substring(0,5)}-${e1.endTime?.substring(0,5)}).`,
          });
          continue;
        }

        // Room overlap
        if (e1.room?.id && e2.room?.id && e1.room.id === e2.room.id) {
          checkedPairs.add(pairKey);
          conflictPairs.push({
            entry1: e1,
            entry2: e2,
            type: 'ROOM',
            description: `Salle ${e1.room.name} réservée simultanément par ${e1.classe?.name || 'Classe 1'} et ${e2.classe?.name || 'Classe 2'} (${e1.dayOfWeek} ${e1.startTime?.substring(0,5)}-${e1.endTime?.substring(0,5)}).`,
          });
          continue;
        }

        // Class overlap
        if (e1.classe?.id && e2.classe?.id && e1.classe.id === e2.classe.id) {
          checkedPairs.add(pairKey);
          conflictPairs.push({
            entry1: e1,
            entry2: e2,
            type: 'CLASS',
            description: `Classe ${e1.classe.name} a 2 cours en même temps: ${e1.subject?.name} et ${e2.subject?.name} (${e1.dayOfWeek} ${e1.startTime?.substring(0,5)}-${e1.endTime?.substring(0,5)}).`,
          });
          continue;
        }
      }
    }

    return {
      totalEntries: entries.length,
      conflictCount: conflictPairs.length,
      hasConflicts: conflictPairs.length > 0,
      conflicts: conflictPairs,
    };
  },

  async duplicateDay(params: {
    sourceDay: string;
    targetDays: string[];
    classId?: number;
    academicYearId?: number;
    semesterId?: number;
  }) {
    const { sourceDay, targetDays, classId, academicYearId, semesterId } = params;
    const f: any = { dayOfWeek: sourceDay };
    if (classId) f.classe = { id: classId };
    if (academicYearId) f.academicYear = { id: academicYearId };
    if (semesterId) f.semester = { id: semesterId };

    const sourceEntries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: f,
      populate: ['classe', 'subject', 'teacher', 'room', 'academicYear', 'semester'],
    }) as any[];

    if (!sourceEntries.length) return { createdCount: 0, message: 'Aucune entrée trouvée pour le jour source' };

    let createdCount = 0;
    for (const targetDay of targetDays) {
      if (targetDay === sourceDay) continue;
      for (const entry of sourceEntries) {
        await (strapi.entityService.create as any)('api::timetable-entry.timetable-entry', {
          data: {
            dayOfWeek: targetDay,
            startTime: entry.startTime,
            endTime: entry.endTime,
            periodName: entry.periodName || null,
            lessonType: entry.lessonType || 'REGULAR',
            status: 'PUBLISHED',
            roomName: entry.roomName || null,
            notes: entry.notes || null,
            classe: entry.classe?.id ? { connect: [{ id: entry.classe.id }] } : undefined,
            subject: entry.subject?.id ? { connect: [{ id: entry.subject.id }] } : undefined,
            teacher: entry.teacher?.id ? { connect: [{ id: entry.teacher.id }] } : undefined,
            room: entry.room?.id ? { connect: [{ id: entry.room.id }] } : undefined,
            academicYear: entry.academicYear?.id ? { connect: [{ id: entry.academicYear.id }] } : undefined,
            semester: entry.semester?.id ? { connect: [{ id: entry.semester.id }] } : undefined,
          } as any,
        });
        createdCount++;
      }
    }

    return { createdCount, message: `${createdCount} entrées créées avec succès sur ${targetDays.length} jours.` };
  },

  async duplicateClass(params: {
    sourceClassId: number;
    targetClassId: number;
    academicYearId?: number;
    semesterId?: number;
    copyTeachers?: boolean;
  }) {
    const { sourceClassId, targetClassId, academicYearId, semesterId, copyTeachers = true } = params;
    const f: any = { classe: { id: sourceClassId } };
    if (academicYearId) f.academicYear = { id: academicYearId };
    if (semesterId) f.semester = { id: semesterId };

    const sourceEntries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: f,
      populate: ['classe', 'subject', 'teacher', 'room', 'academicYear', 'semester'],
    }) as any[];

    if (!sourceEntries.length) return { createdCount: 0, message: 'Aucune entrée source trouvée' };

    let createdCount = 0;
    for (const entry of sourceEntries) {
      await (strapi.entityService.create as any)('api::timetable-entry.timetable-entry', {
        data: {
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          periodName: entry.periodName || null,
          lessonType: entry.lessonType || 'REGULAR',
          status: 'PUBLISHED',
          roomName: entry.roomName || null,
          notes: entry.notes || null,
          classe: { connect: [{ id: targetClassId }] },
          subject: entry.subject?.id ? { connect: [{ id: entry.subject.id }] } : undefined,
          teacher: (copyTeachers && entry.teacher?.id) ? { connect: [{ id: entry.teacher.id }] } : undefined,
          room: entry.room?.id ? { connect: [{ id: entry.room.id }] } : undefined,
          academicYear: entry.academicYear?.id ? { connect: [{ id: entry.academicYear.id }] } : undefined,
          semester: entry.semester?.id ? { connect: [{ id: entry.semester.id }] } : undefined,
        } as any,
      });
      createdCount++;
    }

    return { createdCount, message: `${createdCount} entrées dupliquées pour la nouvelle classe.` };
  },

  async duplicateTerm(params: {
    sourceSemesterId: number;
    targetSemesterId: number;
    academicYearId?: number;
  }) {
    const { sourceSemesterId, targetSemesterId, academicYearId } = params;
    const f: any = { semester: { id: sourceSemesterId } };
    if (academicYearId) f.academicYear = { id: academicYearId };

    const sourceEntries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: f,
      populate: ['classe', 'subject', 'teacher', 'room', 'academicYear', 'semester'],
    }) as any[];

    if (!sourceEntries.length) return { createdCount: 0, message: 'Aucune entrée source trouvée' };

    let createdCount = 0;
    for (const entry of sourceEntries) {
      await (strapi.entityService.create as any)('api::timetable-entry.timetable-entry', {
        data: {
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          periodName: entry.periodName || null,
          lessonType: entry.lessonType || 'REGULAR',
          status: 'PUBLISHED',
          roomName: entry.roomName || null,
          notes: entry.notes || null,
          classe: entry.classe?.id ? { connect: [{ id: entry.classe.id }] } : undefined,
          subject: entry.subject?.id ? { connect: [{ id: entry.subject.id }] } : undefined,
          teacher: entry.teacher?.id ? { connect: [{ id: entry.teacher.id }] } : undefined,
          room: entry.room?.id ? { connect: [{ id: entry.room.id }] } : undefined,
          academicYear: entry.academicYear?.id ? { connect: [{ id: entry.academicYear.id }] } : undefined,
          semester: { connect: [{ id: targetSemesterId }] },
        } as any,
      });
      createdCount++;
    }

    return { createdCount, message: `${createdCount} entrées dupliquées pour le nouveau semestre/trimestre.` };
  },

  async publishTimetable(params: {
    academicYearId?: number;
    semesterId?: number;
    classId?: number;
    status?: 'PUBLISHED' | 'DRAFT';
  }) {
    const f: any = {};
    if (params.academicYearId) f.academicYear = { id: params.academicYearId };
    if (params.semesterId) f.semester = { id: params.semesterId };
    if (params.classId) f.classe = { id: params.classId };

    const targetStatus = params.status || 'PUBLISHED';
    const entries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: f,
    }) as any[];

    let updatedCount = 0;
    for (const e of entries) {
      await (strapi.entityService.update as any)('api::timetable-entry.timetable-entry', e.id, {
        data: { status: targetStatus },
      });
      updatedCount++;
    }

    return { updatedCount, status: targetStatus, message: `${updatedCount} entrées passées au statut ${targetStatus}.` };
  },

  async bulkDelete(params: {
    ids?: number[];
    classId?: number;
    academicYearId?: number;
    semesterId?: number;
  }) {
    let deletedCount = 0;
    if (Array.isArray(params.ids) && params.ids.length > 0) {
      for (const id of params.ids) {
        await (strapi.entityService.delete as any)('api::timetable-entry.timetable-entry', id);
        deletedCount++;
      }
    } else {
      const f: any = {};
      if (params.classId) f.classe = { id: params.classId };
      if (params.academicYearId) f.academicYear = { id: params.academicYearId };
      if (params.semesterId) f.semester = { id: params.semesterId };

      const entries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
        filters: f,
      }) as any[];

      for (const e of entries) {
        await (strapi.entityService.delete as any)('api::timetable-entry.timetable-entry', e.id);
        deletedCount++;
      }
    }

    return { deletedCount, message: `${deletedCount} entrées supprimées.` };
  },

  async getTimetableAnalytics(academicYearId?: number, semesterId?: number) {
    const f: any = {};
    if (academicYearId) f.academicYear = { id: academicYearId };
    if (semesterId) f.semester = { id: semesterId };

    const entries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: f,
      populate: ['classe', 'subject', 'teacher', 'room'],
    }) as any[];

    const teachers = await (strapi.entityService.findMany as any)('plugin::users-permissions.user', {
      filters: { schoolRole: 'TEACHER' },
    }) as any[];

    const rooms = await (strapi.entityService.findMany as any)('api::school-room.school-room') as any[];
    const classes = await (strapi.entityService.findMany as any)('api::school-class.school-class') as any[];

    // Teacher workload calculation
    const teacherWorkloads: Record<number, { teacher: any; totalMinutes: number; totalSessions: number; classes: Set<string>; subjects: Set<string> }> = {};
    for (const t of teachers) {
      teacherWorkloads[t.id] = {
        teacher: { id: t.id, name: t.name || t.username, email: t.email },
        totalMinutes: 0,
        totalSessions: 0,
        classes: new Set(),
        subjects: new Set(),
      };
    }

    // Room occupancy calculation
    const roomOccupancy: Record<number, { room: any; totalMinutes: number; totalSessions: number }> = {};
    for (const r of rooms) {
      roomOccupancy[r.id] = {
        room: { id: r.id, name: r.name, capacity: r.capacity, roomType: r.roomType },
        totalMinutes: 0,
        totalSessions: 0,
      };
    }

    // Subject distribution per class
    const classSubjectHours: Record<number, { className: string; subjects: Record<string, number> }> = {};
    for (const c of classes) {
      classSubjectHours[c.id] = { className: c.name, subjects: {} };
    }

    for (const entry of entries) {
      const dur = Math.max(0, timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime));
      if (entry.teacher?.id && teacherWorkloads[entry.teacher.id]) {
        teacherWorkloads[entry.teacher.id].totalMinutes += dur;
        teacherWorkloads[entry.teacher.id].totalSessions += 1;
        if (entry.classe?.name) teacherWorkloads[entry.teacher.id].classes.add(entry.classe.name);
        if (entry.subject?.name) teacherWorkloads[entry.teacher.id].subjects.add(entry.subject.name);
      }

      if (entry.room?.id && roomOccupancy[entry.room.id]) {
        roomOccupancy[entry.room.id].totalMinutes += dur;
        roomOccupancy[entry.room.id].totalSessions += 1;
      }

      if (entry.classe?.id && classSubjectHours[entry.classe.id] && entry.subject?.name) {
        const subName = entry.subject.name;
        classSubjectHours[entry.classe.id].subjects[subName] = (classSubjectHours[entry.classe.id].subjects[subName] || 0) + dur;
      }
    }

    const teacherList = Object.values(teacherWorkloads).map(w => ({
      ...w,
      weeklyHours: Math.round((w.totalMinutes / 60) * 10) / 10,
      classes: Array.from(w.classes),
      subjects: Array.from(w.subjects),
    })).sort((a, b) => b.weeklyHours - a.weeklyHours);

    // Standard school week: 5 days * 8 hours = 40 hours (2400 mins)
    const roomList = Object.values(roomOccupancy).map(r => ({
      ...r,
      weeklyHours: Math.round((r.totalMinutes / 60) * 10) / 10,
      utilizationRate: Math.min(100, Math.round((r.totalMinutes / 2400) * 100)),
    })).sort((a, b) => b.utilizationRate - a.utilizationRate);

    const classDistribution = Object.values(classSubjectHours).map(c => ({
      className: c.className,
      subjects: Object.entries(c.subjects).map(([subject, minutes]) => ({
        subject,
        hours: Math.round((minutes / 60) * 10) / 10,
      })),
    }));

    return {
      totalEntries: entries.length,
      totalTeachers: teachers.length,
      totalRooms: rooms.length,
      totalClasses: classes.length,
      teacherWorkloads: teacherList,
      roomOccupancy: roomList,
      classSubjectHours: classDistribution,
    };
  },
};

export default timetableEngine;
