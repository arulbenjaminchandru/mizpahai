import { z } from "zod";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts a YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/live/
 * Returns null if no valid video ID is found.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/live/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Check if the input is already a bare video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Validates whether a URL is a valid Google Drive URL.
 */
export function validateDriveUrl(url: string): boolean {
  if (!url) return false;
  const drivePattern =
    /^https?:\/\/(?:drive|docs)\.google\.com\/.+/i;
  return drivePattern.test(url);
}

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "Display name is required")
      .min(2, "Display name must be at least 2 characters")
      .max(50, "Display name must be at most 50 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Course Schema ───────────────────────────────────────────────────────────

export const courseSchema = z.object({
  name: z
    .string()
    .min(1, "Course name is required")
    .max(100, "Course name must be at most 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be at most 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be at most 2000 characters"),
  coverImageUrl: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal("")),
  instructorName: z
    .string()
    .min(1, "Instructor name is required")
    .max(100, "Instructor name must be at most 100 characters"),
  batchName: z
    .string()
    .min(1, "Batch name is required")
    .max(50, "Batch name must be at most 50 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isPublished: z.boolean(),
});

export type CourseFormData = z.infer<typeof courseSchema>;

// ─── Week Schema ─────────────────────────────────────────────────────────────

export const weekSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z
    .string()
    .min(1, "Week title is required")
    .max(100, "Week title must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .default(""),
  weekNumber: z
    .number()
    .int("Week number must be a whole number")
    .min(1, "Week number must be at least 1"),
  isPublished: z.boolean().default(false),
});

export type WeekFormData = z.infer<typeof weekSchema>;

// ─── Module Schema ───────────────────────────────────────────────────────────

export const moduleSchema = z.object({
  weekId: z.string().min(1, "Week ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
  title: z
    .string()
    .min(1, "Module title is required")
    .max(100, "Module title must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .default(""),
  orderIndex: z
    .number()
    .int("Order index must be a whole number")
    .min(0, "Order index must be at least 0"),
  isPublished: z.boolean().default(false),
});

export type ModuleFormData = z.infer<typeof moduleSchema>;

// ─── Lesson Schema ───────────────────────────────────────────────────────────

export const lessonSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  weekId: z.string().min(1, "Week ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
  title: z
    .string()
    .min(1, "Lesson title is required")
    .max(150, "Lesson title must be at most 150 characters"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .default(""),
  youtubeUrl: z
    .string()
    .min(1, "YouTube URL is required")
    .refine(
      (url) => extractYouTubeVideoId(url) !== null,
      "Please enter a valid YouTube URL (youtube.com/watch?v=, youtu.be/, youtube.com/embed/, or youtube.com/live/)"
    ),
  duration: z
    .number()
    .int("Duration must be a whole number")
    .min(0, "Duration must be at least 0"),
  orderIndex: z
    .number()
    .int("Order index must be a whole number")
    .min(0, "Order index must be at least 0"),
  isPublished: z.boolean().default(false),
});

export type LessonFormData = z.infer<typeof lessonSchema>;

// ─── Resource Schema ─────────────────────────────────────────────────────────

export const resourceSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  weekId: z.string().min(1, "Week ID is required"),
  lessonId: z.string().optional(),
  title: z
    .string()
    .min(1, "Resource title is required")
    .max(150, "Resource title must be at most 150 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .default(""),
  fileType: z.enum(
    ["pdf", "presentation", "document", "spreadsheet", "archive", "other"],
    { message: "Please select a valid file type" }
  ),
  driveUrl: z
    .string()
    .min(1, "Google Drive URL is required")
    .refine(
      (url) => validateDriveUrl(url),
      "Please enter a valid Google Drive URL"
    ),
  category: z.enum(
    ["pdf", "presentation", "document", "spreadsheet", "archive", "other"],
    { message: "Please select a valid category" }
  ),
  orderIndex: z
    .number()
    .int("Order index must be a whole number")
    .min(0, "Order index must be at least 0"),
});

export type ResourceFormData = z.infer<typeof resourceSchema>;

// ─── Enrollment Code Schema ──────────────────────────────────────────────────

export const enrollmentCodeSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  batchName: z
    .string()
    .min(1, "Batch name is required")
    .max(50, "Batch name must be at most 50 characters"),
  maxRedemptions: z
    .number()
    .int("Max redemptions must be a whole number")
    .min(1, "Max redemptions must be at least 1")
    .max(1000, "Max redemptions must be at most 1000"),
  expiresAt: z.string().min(1, "Expiration date is required"),
  prefix: z
    .string()
    .min(2, "Prefix must be at least 2 characters")
    .max(10, "Prefix must be at most 10 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Prefix must contain only uppercase letters and numbers"
    ),
});

export type EnrollmentCodeFormData = z.infer<typeof enrollmentCodeSchema>;

// ─── Enrollment Redemption Schema ────────────────────────────────────────────

export const enrollmentRedemptionSchema = z.object({
  code: z
    .string()
    .min(1, "Enrollment code is required")
    .max(30, "Code must be at most 30 characters")
    .regex(
      /^[A-Z0-9-]+$/,
      "Code must contain only uppercase letters, numbers, and hyphens"
    ),
});

export type EnrollmentRedemptionFormData = z.infer<
  typeof enrollmentRedemptionSchema
>;
