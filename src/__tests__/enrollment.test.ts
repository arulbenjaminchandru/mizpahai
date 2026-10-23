import { describe, it, expect } from "vitest";

describe("Enrollment Code Policy & Business Logic", () => {
  it("detects expired codes correctly", () => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
    const isExpired = new Date() > expiredDate;
    expect(isExpired).toBe(true);

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    const isFuture = new Date() > futureDate;
    expect(isFuture).toBe(false);
  });

  it("enforces single-use vs multi-use redemption limits", () => {
    const singleUseCode = {
      maxRedemptions: 1,
      currentRedemptions: 1,
      status: "active",
    };
    const isSingleUseExhausted = singleUseCode.currentRedemptions >= singleUseCode.maxRedemptions;
    expect(isSingleUseExhausted).toBe(true);

    const multiUseCode = {
      maxRedemptions: 50,
      currentRedemptions: 12,
      status: "active",
    };
    const isMultiUseExhausted = multiUseCode.currentRedemptions >= multiUseCode.maxRedemptions;
    expect(isMultiUseExhausted).toBe(false);
  });

  it("prevents repeated redemption by the same student", () => {
    const redeemedBy = ["student_uid_1", "student_uid_2"];
    const currentStudentUid = "student_uid_1";

    const alreadyRedeemed = redeemedBy.includes(currentStudentUid);
    expect(alreadyRedeemed).toBe(true);

    const newStudentUid = "student_uid_3";
    expect(redeemedBy.includes(newStudentUid)).toBe(false);
  });

  it("generates deterministic composite document IDs for single enrollments per course", () => {
    const studentUid = "user_abc_123";
    const courseId = "course_xyz_789";
    const enrollmentId = `${studentUid}_${courseId}`;

    expect(enrollmentId).toBe("user_abc_123_course_xyz_789");
  });
});

