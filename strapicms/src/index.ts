export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register() {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // Attempt to automatically assign permissions to the Authenticated role
    try {
      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });

      if (authRole) {
        // Find all controllers for school-admin and school-auth
        const schoolAdminActions = [
          'getAllUsers', 'createUser', 'bulkCreateUsers', 'updateUser', 'deleteUser',
          'getAllClasses', 'createClass', 'updateClass', 'deleteClass', 'assignTeacher',
          'assignStudent', 'getClassesForStudent', 'getAllSubjects', 'createSubject',
          'updateSubject', 'deleteSubject', 'getAllMaterials', 'createMaterial',
          'deleteMaterial', 'getMaterialAnalytics', 'getAllTimetables', 'createTimetable', 'updateTimetable',
          'deleteTimetable', 'getExams', 'lockSemesterExams', 'filterResults',
          'getSummaryReport', 'getSemesterGPA', 'finalizeSemester', 'updateProfile',
          'changePassword', 'generateTranscript', 'getStudentTranscriptsList'
        ].map(act => `api::school-admin.school-admin.${act}`);
        
        const schoolAuthActions = [
          'logout', 'me'
        ].map(act => `api::school-auth.school-auth.${act}`);

        const schoolTeacherActions = [
          'getMyClasses', 'getStudentsByClass', 'getMyStudents', 'submitAttendance',
          'updateAttendance', 'getAttendanceHistory', 'createExam', 'getMyExams',
          'updateExam', 'deleteExam', 'toggleExamStatus', 'getGradebook',
          'saveBulkResults', 'createResult', 'updateResult', 'submitResults',
          'getResults', 'filterResults', 'submitMarks', 'getMyTimetable',
          'getAllSubjects', 'updateProfile', 'changePassword',
          'getTeacherMaterials', 'getMyClassesForMaterials', 'uploadTeacherMaterial', 'deleteTeacherMaterial',
          'getStudentTranscriptsList', 'previewTranscript'
        ].map(act => `api::school-teacher.school-teacher.${act}`);

        const schoolStudentActions = [
          'getProfile', 'updateProfile', 'changePassword',
          'getMyClasses', 'getMyAttendance', 'getMyTimetable',
          'getMyExams', 'getMyResults', 'getMaterialsByClass',
          'getSemesterTranscript', 'getDashboardStats', 'previewTranscript', 'getStudentTranscriptsList'
        ].map(act => `api::school-student.school-student.${act}`);

        const schoolFinanceActions = [
          'getStats', 'recalculateSystem', 'getAuditLogs', 'createInvoice',
          'approveInvoice', 'rejectInvoice', 'createPayment', 'approvePayment',
          'rejectPayment', 'getStudentStatement', 'createSalaryRecord', 'approveSalaryRecord',
          'rejectSalaryRecord', 'createSalaryPayment', 'approveSalaryPayment', 'rejectSalaryPayment'
        ].map(act => `api::school-finance.school-finance.${act}`);

        const semesterActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::semester.semester.${act}`);
        const termActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::term.term.${act}`);
        const academicYearActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::academic-year.academic-year.${act}`);
        const transcriptActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::transcript.transcript.${act}`);

        // Accounting Collections
        const studentInvoiceActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::student-invoice.student-invoice.${act}`);
        const studentPaymentActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::student-payment.student-payment.${act}`);
        const salaryRecordActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::salary-record.salary-record.${act}`);
        const salaryPaymentActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::salary-payment.salary-payment.${act}`);
        const financialStatementActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::financial-statement.financial-statement.${act}`);
        const receiptActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::receipt.receipt.${act}`);
        const accountingLogActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::accounting-log.accounting-log.${act}`);
        const paymentCategoryActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::payment-category.payment-category.${act}`);
        const financialReportActions = ['find', 'findOne', 'create', 'update', 'delete'].map(act => `api::financial-report.financial-report.${act}`);

        const allActions = [
          ...schoolAdminActions, 
          ...schoolAuthActions, 
          ...schoolTeacherActions, 
          ...schoolStudentActions,
          ...schoolFinanceActions,
          ...semesterActions,
          ...termActions,
          ...academicYearActions,
          ...transcriptActions,
          ...studentInvoiceActions,
          ...studentPaymentActions,
          ...salaryRecordActions,
          ...salaryPaymentActions,
          ...financialStatementActions,
          ...receiptActions,
          ...accountingLogActions,
          ...paymentCategoryActions,
          ...financialReportActions,
          'api::contact-message.contact-message.create',
          'api::newsletter-subscription.newsletter-subscription.create'
        ];

        for (const action of allActions) {
          const authPermission = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: { role: authRole.id, action },
          });

          if (!authPermission) {
            await strapi.db.query('plugin::users-permissions.permission').create({
              data: {
                role: authRole.id,
                action,
              },
            });
            strapi.log.info(`[ACL Matrix] Granted Authenticated access to ${action}`);
          }
        }
      }

      // Automatically assign public submission permissions for the Contact Form
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (publicRole) {
        const publicActions = [
            'api::contact-message.contact-message.create',
            'api::newsletter-subscription.newsletter-subscription.create'
        ];
        
        for (const publicAction of publicActions) {
            const publicPermission = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: { role: publicRole.id, action: publicAction },
            });

            if (!publicPermission) {
            await strapi.db.query('plugin::users-permissions.permission').create({
                data: { role: publicRole.id, action: publicAction },
            });
            strapi.log.info(`[ACL Matrix] Granted Public access to ${publicAction}`);
            }
        }
      }

      // 1. Repair any existing users created manually from the dashboard who got stuck with a null provider
      await strapi.db.query('plugin::users-permissions.user').updateMany({
        where: { provider: null },
        data: { provider: 'local' },
      });

      // Data migration for existing exams and classes
      try {
        const exams = await strapi.entityService.findMany('api::school-exam.school-exam', {
          populate: ['academicYear', 'semesterRel', 'termRel', 'classe']
        }) as any[];

        for (const exam of exams) {
          let updatedData: any = {};
          let academicYearEntity: any = exam.academicYear;
          let semesterEntity: any = exam.semesterRel;
          let termEntity: any = exam.termRel;

          // Resolve Academic Year
          if (!academicYearEntity) {
            const name = "2025-2026";
            const existingYears = await strapi.entityService.findMany('api::academic-year.academic-year', {
              filters: { name }
            }) as any[];
            if (existingYears.length > 0) {
              academicYearEntity = existingYears[0];
            } else {
              academicYearEntity = await strapi.entityService.create('api::academic-year.academic-year', {
                data: { name }
              });
              strapi.log.info(`[Migration] Created Academic Year ${name}`);
            }
            updatedData.academicYear = academicYearEntity.id;
          }

          // Resolve Semester
          if (!semesterEntity && exam.semester) {
            const semName = exam.semester;
            const existingSemesters = await strapi.entityService.findMany('api::semester.semester', {
              filters: { name: semName, academicYear: academicYearEntity.id }
            }) as any[];
            if (existingSemesters.length > 0) {
              semesterEntity = existingSemesters[0];
            } else {
              semesterEntity = await strapi.entityService.create('api::semester.semester', {
                data: {
                  name: semName,
                  academicYear: academicYearEntity.id
                }
              });
              strapi.log.info(`[Migration] Created Semester ${semName}`);
            }
            updatedData.semesterRel = semesterEntity.id;
          }

          // Resolve Term
          if (!termEntity && exam.term) {
            const termName = exam.term;
            const existingTerms = await strapi.entityService.findMany('api::term.term', {
              filters: { name: termName, semester: semesterEntity?.id }
            }) as any[];
            if (existingTerms.length > 0) {
              termEntity = existingTerms[0];
            } else {
              termEntity = await strapi.entityService.create('api::term.term', {
                data: {
                  name: termName,
                  semester: semesterEntity?.id
                }
              });
              strapi.log.info(`[Migration] Created Term ${termName}`);
            }
            updatedData.termRel = termEntity.id;
          }

          if (Object.keys(updatedData).length > 0) {
            await strapi.entityService.update('api::school-exam.school-exam', exam.id, {
              data: updatedData
            });
            strapi.log.info(`[Migration] Updated Exam ${exam.id} with new relations`);
          }

          // Also migrate Class to Academic Year if needed
          if (exam.classe && academicYearEntity) {
            const classEntity = await strapi.entityService.findOne('api::school-class.school-class', exam.classe.id, {
              populate: ['academicYear']
            }) as any;
            if (classEntity && !classEntity.academicYear) {
              await strapi.entityService.update('api::school-class.school-class', classEntity.id, {
                data: { academicYear: academicYearEntity.id }
              });
              strapi.log.info(`[Migration] Linked Class ${classEntity.name} to Academic Year ${academicYearEntity.name}`);
            }
          }
        }
      } catch (migrationError) {
        strapi.log.error('Migration failed:', migrationError);
      }

      // 2. Attach a permanent database lifecycle hook so future dashboard users never get locked out again
      strapi.db.lifecycles.subscribe({
        models: ['plugin::users-permissions.user'],
        async beforeCreate(event) {
          if (!event.params.data.provider) {
            event.params.data.provider = 'local';
          }
        },
      });

    } catch (e) {
      strapi.log.error('Failed to auto-assign role permissions. Ensure the database matches the v5 shape.', e);
    }
  },
};
