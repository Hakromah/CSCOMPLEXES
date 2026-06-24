// ─── Core User Types ────────────────────────────────────────────────────────
export interface SchoolUser {
  id: number;
  userId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // computed full name or username
  schoolRole: SchoolRole;
  phoneNumber?: string;
  address?: string;
  gender?: 'Male' | 'Female' | 'Other';
  birthDate?: string;
  birthCountry?: string;
  birthCity?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export type SchoolRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACCOUNTANT' | 'ACCOUNTLEAD' | 'DRIVER' | 'WORKER' | 'PARENT';

// ─── Family & Parent Types ───────────────────────────────────────────────────
export interface Family {
  id: number;
  familyCode: string;
  familyName: string;
  address?: string;
  nationality?: string;
  city?: string;
  emergencyContact1Name?: string;
  emergencyContact1Phone?: string;
  emergencyContact1Relation?: string;
  emergencyContact2Name?: string;
  emergencyContact2Phone?: string;
  emergencyContact2Relation?: string;
  notes?: string;
  isActive: boolean;
  parents?: SchoolUser[];
  students?: SchoolUser[];
  createdAt: string;
  updatedAt: string;
}

export interface ParentStudentRelation {
  id: number;
  parent?: SchoolUser;
  student?: SchoolUser;
  family?: Family;
  relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'UNCLE' | 'AUNT' | 'GRANDPARENT' | 'OTHER';
  isPrimary: boolean;
  canPickup: boolean;
  canViewFinance: boolean;
  canViewAcademics: boolean;
  notes?: string;
  createdAt: string;
}

// ─── Academic Types ──────────────────────────────────────────────────────────
export interface SchoolClass {
  id: number;
  name: string;
  grade?: string;
  academicYear?: AcademicYear;
  teachers?: SchoolUser[];
  students?: SchoolUser[];
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
}

export interface AcademicYear {
  id: number;
  name: string;
}

export interface Semester {
  id: number;
  name: string;
  academicYear?: AcademicYear;
}

export interface Term {
  id: number;
  name: string;
  semester?: Semester;
}

export interface TimetableEntry {
  id: number;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  classe?: SchoolClass;
  subject?: Subject;
  teacher?: SchoolUser;
}

export interface SchoolExam {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  term?: string;
  semester: string;
  weight?: number;
  closed: boolean;
  locked: boolean;
  classe?: SchoolClass;
  teacher?: SchoolUser;
  subject?: Subject;
  academicYear?: AcademicYear;
}

export interface ExamResult {
  id: number;
  marks: number;
  grade?: string;
  letterGrade?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'GRADED';
  remarks?: string;
  exam?: SchoolExam;
  student?: SchoolUser;
}

export interface LearningMaterial {
  id: number;
  title: string;
  description?: string;
  fileUrl?: string;
  file?: any;
  classe?: SchoolClass;
  subject?: Subject;
  uploadedBy?: SchoolUser;
  createdAt: string;
}

// ─── Attendance Types ────────────────────────────────────────────────────────
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';

export interface AttendanceSession {
  id: number;
  date: string;
  sessionTime?: string;
  notes?: string;
  classe?: SchoolClass;
  subject?: Subject;
  records?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: number;
  status: AttendanceStatus;
  student?: SchoolUser;
  session?: AttendanceSession;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  sick: number;
  total: number;
  presentPercent: number;
}

// ─── Finance Types ────────────────────────────────────────────────────────────
export type InvoiceStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'PARTIALLY_PAID';
export type PaymentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type PaymentMethod = 'CASH' | 'BANK' | 'MOBILE_MONEY' | 'CARD';
export type PaymentCategory = 'TUITION' | 'TRANSPORT' | 'TSHIRT' | 'REGISTRATION' | 'OTHER';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category?: PaymentCategory;
}

export interface StudentInvoice {
  id: number;
  invoiceNumber: string;
  student?: SchoolUser;
  month: string;
  year: number;
  dueDate: string;
  status: InvoiceStatus;
  notes?: string;
  rejectionReason?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalPaid: number;
  remainingBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPayment {
  id: number;
  paymentNumber: string;
  invoice?: StudentInvoice;
  student?: SchoolUser;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentCategory: PaymentCategory;
  status: PaymentStatus;
  notes?: string;
  currency?: string;
  createdAt: string;
}

export interface Receipt {
  id: number;
  receiptNumber: string;
  paymentType: 'STUDENT_PAYMENT' | 'SALARY_PAYMENT';
  studentPayment?: StudentPayment;
  generatedDate: string;
  qrCode?: string;
  pdfUrl?: string;
}

export interface SalaryRecord {
  id: number;
  recordNumber: string;
  staff?: SchoolUser;
  month: string;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
}

export interface SalaryPayment {
  id: number;
  paymentNumber: string;
  salaryRecord?: SalaryRecord;
  staff?: SchoolUser;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

export interface StudentFinancialSummary {
  student: SchoolUser;
  totalCharged: number;
  totalPaid: number;
  outstandingBalance: number;
  invoices: StudentInvoice[];
  recentPayments: StudentPayment[];
}

export interface FamilyFinancialSummary {
  family: Family;
  totalCharged: number;
  totalPaid: number;
  totalOutstanding: number;
  children: StudentFinancialSummary[];
}

// ─── Transport Types ──────────────────────────────────────────────────────────
export interface TransportAssignment {
  id: number;
  student?: SchoolUser;
  driver?: SchoolUser;
  academicYear?: AcademicYear;
  routeName: string;
  pickupPoint: string;
  dropoffPoint: string;
  pickupTime?: string;
  dropoffTime?: string;
  vehicleInfo?: string;
  transportFee?: number;
  isActive: boolean;
  notes?: string;
}

// ─── Behavior Types ───────────────────────────────────────────────────────────
export type BehaviorType = 'ACHIEVEMENT' | 'AWARD' | 'WARNING' | 'DISCIPLINE' | 'INCIDENT' | 'RECOGNITION' | 'OTHER';
export type BehaviorSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface BehaviorRecord {
  id: number;
  student?: SchoolUser;
  recordedBy?: SchoolUser;
  date: string;
  type: BehaviorType;
  title: string;
  description?: string;
  severity?: BehaviorSeverity;
  notifyParent: boolean;
  parentNotified: boolean;
  attachmentUrl?: string;
  createdAt: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────
export type NotificationType = 'ATTENDANCE' | 'FEE_REMINDER' | 'PAYMENT' | 'EXAM_RESULT' | 'HOMEWORK' | 'ANNOUNCEMENT' | 'EVENT' | 'BEHAVIOR' | 'SALARY' | 'GENERAL';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipient?: SchoolUser;
  sender?: SchoolUser;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ─── Message Types ────────────────────────────────────────────────────────────
export interface SchoolMessage {
  id: number;
  subject: string;
  body: string;
  sender?: SchoolUser;
  recipient?: SchoolUser;
  threadId?: string;
  parentMessage?: SchoolMessage;
  isReadBySender: boolean;
  isReadByRecipient: boolean;
  readAt?: string;
  isDeletedBySender: boolean;
  isDeletedByRecipient: boolean;
  attachmentUrl?: string;
  senderRole?: string;
  recipientRole?: string;
  createdAt: string;
  replies?: SchoolMessage[];
}

// ─── School Event Types ───────────────────────────────────────────────────────
export type EventType = 'ACADEMIC' | 'EXAM' | 'HOLIDAY' | 'MEETING' | 'SPORTS' | 'CULTURAL' | 'TRIP' | 'OTHER';
export type EventAudience = 'ALL' | 'STUDENTS' | 'PARENTS' | 'STAFF' | 'CLASS';

export interface SchoolEvent {
  id: number;
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate?: string;
  location?: string;
  targetAudience: EventAudience;
  targetClass?: SchoolClass;
  requiresConfirmation: boolean;
  isPublished: boolean;
  createdBy?: SchoolUser;
  createdAt: string;
}

// ─── Transcript Types ─────────────────────────────────────────────────────────
export interface Transcript {
  id: number;
  referenceNumber: string;
  generationDate: string;
  student?: SchoolUser;
  academicYear?: AcademicYear;
  class?: SchoolClass;
  gpa?: number;
  averageScore?: number;
  createdAt: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────
export interface ParentDashboardStats {
  totalChildren: number;
  outstandingBalance: number;
  unreadNotifications: number;
  upcomingExams: number;
  attendanceSummary: AttendanceSummary;
  children: SchoolUser[];
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalClasses: number;
  totalExams: number;
  totalSubjects: number;
}

// ─── Accounting Log ───────────────────────────────────────────────────────────
export interface AccountingLog {
  id: number;
  actionType: string;
  entityName: string;
  entityId: string;
  performedBy?: SchoolUser;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: string;
  notes?: string;
}

// ─── Payment Provider Types ───────────────────────────────────────────────────
export interface PaymentProviderConfig {
  type: 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD';
  name: string;
  isEnabled: boolean;
}
