import { type Timestamp } from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "student";

export type UserStatus = "active" | "suspended";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  selectedCourseId?: string | null;
  instagramFollowed?: boolean;
  linkedinFollowed?: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

// ─── Course ──────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  instructorName: string;
  batchName: string;
  startDate: Timestamp;
  endDate: Timestamp;
  isPublished: boolean;
  actualPrice?: number;
  currentPrice?: number;
  currency?: string;
  pricingEnabled?: boolean;
  discountPercentage?: number;
  brochureUrl?: string;
  brochureEnabled?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Week ────────────────────────────────────────────────────────────────────

export interface Week {
  id: string;
  courseId: string;
  title: string;
  description: string;
  weekNumber: number;
  isPublished: boolean;
  createdAt: Timestamp;
}

// ─── Module ──────────────────────────────────────────────────────────────────

export interface Module {
  id: string;
  weekId: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  isPublished: boolean;
  createdAt: Timestamp;
}

// ─── Lesson ──────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  moduleId: string;
  weekId: string;
  courseId: string;
  title: string;
  description: string;
  youtubeVideoId: string;
  duration: number;
  orderIndex: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Resource ────────────────────────────────────────────────────────────────

export type ResourceCategory =
  | "pdf"
  | "presentation"
  | "document"
  | "spreadsheet"
  | "archive"
  | "other";

export interface Resource {
  id: string;
  courseId: string;
  weekId: string;
  lessonId?: string;
  title: string;
  description: string;
  fileType: ResourceCategory;
  driveUrl: string;
  category: ResourceCategory;
  orderIndex: number;
  createdAt: Timestamp;
}

// ─── Enrollment Code ─────────────────────────────────────────────────────────

export type EnrollmentCodeStatus = "active" | "revoked" | "expired";

export interface EnrollmentCode {
  id: string;
  code: string;
  codePrefix: string;
  courseId: string;
  batchName: string;
  maxRedemptions: number;
  currentRedemptions: number;
  expiresAt: Timestamp;
  status: EnrollmentCodeStatus;
  createdBy: string;
  createdAt: Timestamp;
  redeemedBy: string[];
}

// ─── Enrollment ──────────────────────────────────────────────────────────────

export type EnrollmentStatus = "active" | "suspended" | "revoked";

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  batchName: string;
  enrollmentCodeId: string;
  enrolledAt: Timestamp;
  status: EnrollmentStatus;
  grantedBy?: string;
  grantedAt?: Timestamp | null;
  revokedAt?: Timestamp | null;
  revokedBy?: string | null;
  revocationReason?: string | null;
}

// ─── Course Purchase Enquiry ─────────────────────────────────────────────────

export type CourseEnquiryStatus =
  | "new"
  | "contacted"
  | "awaiting_payment"
  | "payment_under_verification"
  | "payment_confirmed"
  | "access_granted"
  | "rejected"
  | "cancelled";

export interface CourseEnquiry {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentPhoneNumber?: string | null;
  courseId: string;
  courseNameSnapshot: string;
  actualPriceSnapshot: number;
  currentPriceSnapshot: number;
  discountSnapshot: number;
  status: CourseEnquiryStatus;
  adminNotes?: string;
  paymentConfirmedAt?: Timestamp | null;
  paymentConfirmedBy?: string | null;
  paymentNotes?: string;
  accessGrantedAt?: Timestamp | null;
  accessGrantedBy?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Course Access Audit Log ─────────────────────────────────────────────────

export interface CourseAccessAudit {
  id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  studentName?: string;
  studentEmail?: string;
  action: "granted" | "revoked";
  previousStatus?: string;
  newStatus: string;
  performedBy: string; // admin UID
  performedByEmail?: string;
  reason?: string;
  createdAt: Timestamp;
}

// ─── Academy Settings ────────────────────────────────────────────────────────

export interface AcademySettings {
  whatsappNumber: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

// ─── Lesson Progress ─────────────────────────────────────────────────────────

export interface LessonProgress {
  id: string;
  lessonId: string;
  userId: string;
  courseId: string;
  completed: boolean;
  completedAt: Timestamp | null;
}

// ─── Live Classes ────────────────────────────────────────────────────────────

export type MeetingPlatform =
  | "google-meet"
  | "microsoft-teams"
  | "zoom"
  | "other";

export interface LiveClass {
  id: string;
  courseId: string;
  courseName?: string;
  title: string;
  description?: string;
  meetingUrl: string;
  meetingPlatform: MeetingPlatform;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  isActive: boolean;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Live Class Participants / Course Access ─────────────────────────────────

export interface LiveClassParticipant {
  id: string;
  courseId: string;
  userId: string;
  studentEmail: string;
  studentName: string;
  approved: boolean;
  approvedAt?: Timestamp | null;
  approvedBy?: string | null;
  revokedAt?: Timestamp | null;
  revokedBy?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

