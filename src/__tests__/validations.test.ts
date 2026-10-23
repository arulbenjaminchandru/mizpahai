import { describe, it, expect } from "vitest";
import {
  extractYouTubeVideoId,
  validateDriveUrl,
  loginSchema,
  registerSchema,
  courseSchema,
  enrollmentRedemptionSchema,
} from "../lib/validations";

describe("YouTube URL Sanitization & ID Extraction", () => {
  it("extracts ID from standard watch URL", () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from short youtu.be URL", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from embed URL", () => {
    const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
    expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from live stream URL", () => {
    const url = "https://www.youtube.com/live/dQw4w9WgXcQ";
    expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
  });

  it("accepts a raw 11-character video ID directly", () => {
    expect(extractYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects malicious or invalid URLs", () => {
    expect(extractYouTubeVideoId("https://vimeo.com/123456")).toBeNull();
    expect(extractYouTubeVideoId("javascript:alert(1)")).toBeNull();
    expect(extractYouTubeVideoId("https://malicious-site.com/watch?v=123")).toBeNull();
    expect(extractYouTubeVideoId("")).toBeNull();
  });
});

describe("Google Drive Resource URL Validation", () => {
  it("validates legitimate Google Drive file links", () => {
    expect(validateDriveUrl("https://drive.google.com/file/d/1a2b3c4d/view")).toBe(true);
    expect(validateDriveUrl("https://drive.google.com/drive/folders/1a2b3c4d")).toBe(true);
    expect(validateDriveUrl("https://docs.google.com/presentation/d/1a2b3c/edit")).toBe(true);
    expect(validateDriveUrl("https://docs.google.com/spreadsheets/d/1a2b3c/edit")).toBe(true);
  });

  it("rejects non-Google Drive links", () => {
    expect(validateDriveUrl("https://dropbox.com/s/12345")).toBe(false);
    expect(validateDriveUrl("https://onedrive.live.com/123")).toBe(false);
    expect(validateDriveUrl("http://malicious-drive.com")).toBe(false);
    expect(validateDriveUrl("")).toBe(false);
  });
});

describe("Auth & Course Zod Schemas", () => {
  it("validates correct login credentials", () => {
    const valid = { email: "student@datahorizon.ai", password: "SecurePassword123!" };
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid login credentials", () => {
    const invalidEmail = { email: "not-an-email", password: "123" };
    expect(loginSchema.safeParse(invalidEmail).success).toBe(false);
  });

  it("enforces strong passwords on registration", () => {
    const weakPass = {
      displayName: "Jane Doe",
      email: "jane@datahorizon.ai",
      password: "weak",
      confirmPassword: "weak",
    };
    expect(registerSchema.safeParse(weakPass).success).toBe(false);

    const strongPass = {
      displayName: "Jane Doe",
      email: "jane@datahorizon.ai",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    };
    expect(registerSchema.safeParse(strongPass).success).toBe(true);
  });

  it("validates course schema with required fields and slug format", () => {
    const validCourse = {
      name: "Data Engineering with Spark",
      slug: "data-engineering-with-spark",
      description: "Comprehensive Apache Spark & Distributed Systems",
      coverImageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475",
      instructorName: "Arul B.",
      batchName: "Batch 2026",
      startDate: "2026-01-15",
      endDate: "2026-04-15",
      isPublished: true,
    };
    expect(courseSchema.safeParse(validCourse).success).toBe(true);

    const invalidSlug = {
      ...validCourse,
      slug: "Invalid Slug with Spaces!",
    };
    expect(courseSchema.safeParse(invalidSlug).success).toBe(false);
  });

  it("validates enrollment redemption code input", () => {
    expect(enrollmentRedemptionSchema.safeParse({ code: "DH-2026-AB12CD" }).success).toBe(true);
    expect(enrollmentRedemptionSchema.safeParse({ code: "DH-AI-9999" }).success).toBe(true);
    expect(enrollmentRedemptionSchema.safeParse({ code: "" }).success).toBe(false);
    expect(enrollmentRedemptionSchema.safeParse({ code: "INVALID CODE WITH SPACES" }).success).toBe(false);
  });
});

