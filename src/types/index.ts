import { type Timestamp } from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "student";

export type UserStatus = "active" | "suspended";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
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

export type EnrollmentStatus = "active" | "suspended";

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  batchName: string;
  enrollmentCodeId: string;
  enrolledAt: Timestamp;
  status: EnrollmentStatus;
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
