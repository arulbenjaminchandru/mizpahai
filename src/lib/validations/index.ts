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
    /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /^(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/live/VIDEO_ID
    /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
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

/**
 * Validates international phone number according to E.164 standards.
 * Standard E.164 regex: starts with +, followed by 8 to 15 digits total.
 * For +91 (India default), checks that it has exactly 10 digits (6-9 leading).
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  if (!e164Regex.test(trimmed)) return false;

  // Specific check for India (+91)
  if (trimmed.startsWith("+91")) {
    const local = trimmed.slice(3);
    return /^[6-9]\d{9}$/.test(local);
  }

  return true;
}

/**
 * Formats a country code and local phone number into standard E.164 format.
 */
export function formatToE164(countryCode: string, localNumber: string): string {
  const cleanCode = countryCode.trim().startsWith("+")
    ? countryCode.trim()
    : `+${countryCode.trim()}`;
  const cleanNumber = localNumber.replace(/\D/g, "");
  return `${cleanCode}${cleanNumber}`;
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
    countryCode: z.string().default("+91").optional(),
    phoneNumber: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        const formatted = val.startsWith("+") ? val : `+91${val.replace(/\D/g, "")}`;
        return validatePhoneNumber(formatted);
      }, "Please enter a valid mobile number in E.164 format"),
    selectedCourseId: z.string().optional(),
    instagramFollowed: z.boolean().optional(),
    linkedinFollowed: z.boolean().optional(),
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

/**
 * Strict schema for student onboarding where mobile number is mandatory.
 */
export const studentRegisterSchema = z
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
    countryCode: z.string().min(1, "Country code is required"),
    phoneNumber: z
      .string()
      .min(1, "Mobile number is required")
      .refine((val) => {
        const formatted = val.startsWith("+") ? val : `+91${val.replace(/\D/g, "")}`;
        return validatePhoneNumber(formatted);
      }, "Please enter a valid 10-digit mobile number or international phone number"),
    selectedCourseId: z.string().optional(),
    instagramFollowed: z.boolean().optional(),
    linkedinFollowed: z.boolean().optional(),
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

export type StudentRegisterFormData = z.infer<typeof studentRegisterSchema>;

export const profilePhoneUpdateSchema = z.object({
  countryCode: z.string().min(1, "Country code is required").default("+91"),
  phoneNumber: z
    .string()
    .min(1, "Mobile number is required")
    .refine((val) => {
      const formatted = val.startsWith("+") ? val : `+91${val.replace(/\D/g, "")}`;
      return validatePhoneNumber(formatted);
    }, "Please enter a valid 10-digit mobile number or international phone number in E.164 format"),
});

export type ProfilePhoneUpdateFormData = z.infer<typeof profilePhoneUpdateSchema>;

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

// ─── Live Class Schemas ──────────────────────────────────────────────────────

export const liveClassSchema = z.object({
  courseId: z.string().min(1, "Course selection is required"),
  title: z
    .string()
    .min(1, "Class title is required")
    .max(150, "Class title must be at most 150 characters"),
  description: z.string().max(1000).optional().default(""),
  meetingUrl: z
    .string()
    .min(1, "Meeting URL is required")
    .url("Please enter a valid URL")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    }, "Meeting URL must start with https:// or http://")
    .refine(
      (url) => !url.trim().toLowerCase().startsWith("javascript:"),
      "Unsafe URL scheme detected (javascript: is prohibited)"
    ),
  meetingPlatform: z.enum(["google-meet", "microsoft-teams", "zoom", "other"], {
    message: "Please select a valid meeting platform",
  }),
  scheduledDate: z
    .string()
    .min(1, "Scheduled date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z
    .string()
    .min(1, "Start time is required")
    .regex(/^\d{1,2}:\d{2}(\s*(AM|PM|am|pm))?$/, "Time must be valid (e.g. 10:00 or 10:00 AM)"),
  endTime: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(true),
});

export type LiveClassFormData = z.infer<typeof liveClassSchema>;

export const liveClassApprovalSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  userIds: z.array(z.string().min(1)).min(1, "At least one participant must be selected"),
  approved: z.boolean(),
});

export type LiveClassApprovalData = z.infer<typeof liveClassApprovalSchema>;

// ─── Course Pricing, Brochure & WhatsApp Enquiries ──────────────────────────

/**
 * Validates whether a URL is a legitimate HTTPS Google Drive sharing URL.
 */
export function validateGoogleDriveBrochureUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith("javascript:")) return false;
  const pattern = /^https:\/\/(?:drive|docs)\.google\.com\/.+/i;
  return pattern.test(trimmed);
}

/**
 * Calculates discount percentage: ((actualPrice - currentPrice) / actualPrice) * 100
 */
export function calculateDiscountPercentage(
  actualPrice: number,
  currentPrice: number
): number {
  if (
    typeof actualPrice !== "number" ||
    typeof currentPrice !== "number" ||
    isNaN(actualPrice) ||
    isNaN(currentPrice)
  ) {
    return 0;
  }
  if (actualPrice <= 0 || currentPrice < 0) return 0;
  if (currentPrice >= actualPrice) return 0;
  const discount = ((actualPrice - currentPrice) / actualPrice) * 100;
  return Math.round(discount * 100) / 100;
}

/**
 * Formats an amount into standard Indian Rupee (₹) representation.
 */
export function formatIndianCurrency(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates official pre-filled WhatsApp course purchase enquiry URL.
 */
export function generateWhatsAppEnquiryUrl(params: {
  courseName: string;
  actualPrice: number;
  currentPrice: number;
  discountPercentage: number;
  studentName: string;
  studentEmail: string;
  whatsappNumber?: string;
}): string {
  const rawNumber = params.whatsappNumber || "+919894481283";
  const cleanPhone = rawNumber.replace(/[^0-9]/g, "");
  const discountStr =
    params.discountPercentage > 0
      ? `${params.discountPercentage.toFixed(2)}%`
      : "0%";
  const actualStr = formatIndianCurrency(params.actualPrice);
  const currentStr = formatIndianCurrency(params.currentPrice);

  const message = `Hello Tiben AI Academy!

I am interested in enrolling in the following course.

Course Name: ${params.courseName}
Actual Price: ${actualStr}
Current Offer Price: ${currentStr}
Discount: ${discountStr}

I have submitted a course purchase enquiry through your website.
I would like to know the available purchase coupon and enrollment procedure.

Registered Name: ${params.studentName}
Registered Email: ${params.studentEmail}

Please assist me with the next steps.

Thank you!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const coursePricingSchema = z
  .object({
    actualPrice: z.number().min(0, "Actual price cannot be negative"),
    currentPrice: z.number().min(0, "Current price cannot be negative"),
    currency: z.string().default("INR"),
    pricingEnabled: z.boolean().default(true),
  })
  .refine((data) => data.currentPrice <= data.actualPrice, {
    message: "Current offer price cannot exceed actual course price",
    path: ["currentPrice"],
  });

export type CoursePricingFormData = z.infer<typeof coursePricingSchema>;

export const courseBrochureSchema = z.object({
  brochureUrl: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      return validateGoogleDriveBrochureUrl(val);
    }, "Must be a valid HTTPS Google Drive URL (e.g. https://drive.google.com/file/d/.../view)"),
  brochureEnabled: z.boolean().default(false),
});

export type CourseBrochureFormData = z.infer<typeof courseBrochureSchema>;

export const courseEnquiryCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export type CourseEnquiryCreateData = z.infer<typeof courseEnquiryCreateSchema>;

export const courseEnquiryAdminUpdateSchema = z.object({
  status: z
    .enum([
      "new",
      "contacted",
      "awaiting_payment",
      "payment_under_verification",
      "payment_confirmed",
      "access_granted",
      "rejected",
      "cancelled",
    ])
    .optional(),
  adminNotes: z.string().max(2000).optional(),
  paymentConfirmed: z.boolean().optional(),
  paymentNotes: z.string().max(1000).optional(),
});

export type CourseEnquiryAdminUpdateData = z.infer<
  typeof courseEnquiryAdminUpdateSchema
>;

export const courseAccessRevokeSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
  reason: z.string().max(500).optional(),
});

export type CourseAccessRevokeData = z.infer<typeof courseAccessRevokeSchema>;


