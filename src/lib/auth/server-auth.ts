import { type NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: "admin" | "student";
  isAdmin: boolean;
  status: "active" | "suspended";
}

/**
 * Verifies the Firebase ID token from the Authorization header (Bearer <token>).
 * Also checks the user's status and role in Firestore to ensure up-to-date permissions.
 */
export async function verifyAuth(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1]?.trim();
    if (!token) return null;

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Check custom claims
    const hasAdminClaim = decodedToken.role === "admin";

    // Fetch user status and role from Firestore for authoritative check
    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: hasAdminClaim ? "admin" : "student",
        isAdmin: hasAdminClaim,
        status: "active",
      };
    }

    const userData = userDoc.data();
    const status = (userData?.status || "active") as "active" | "suspended";
    const role = (hasAdminClaim || userData?.role === "admin") ? "admin" : "student";

    if (status === "suspended") {
      return null; // Suspended accounts are denied access
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
      isAdmin: role === "admin",
      status,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Requires admin privileges. Throws or returns 403 response if not admin.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const user = await verifyAuth(req);
  if (!user || !user.isAdmin) {
    return null;
  }
  return user;
}

