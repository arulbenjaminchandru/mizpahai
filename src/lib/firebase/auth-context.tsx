"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { User } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The raw Firebase Auth user object, or null if not signed in. */
  user: FirebaseUser | null;
  /** The user's Firestore profile document. */
  userProfile: User | null;
  /** Whether the auth state is still being determined. */
  loading: boolean;
  /** Whether the authenticated user has the admin role. */
  isAdmin: boolean;
  /** Sign in with Google popup. */
  signInWithGoogle: () => Promise<void>;
  /** Sign in with email and password. */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Create a new account with email, password, and display name. */
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
  /** Send a password reset email. */
  resetPassword: (email: string) => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch the Firestore profile and admin claim for a given Firebase user
  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      // Check custom claims for admin role
      const tokenResult = await firebaseUser.getIdTokenResult();
      const hasAdminClaim = tokenResult.claims.role === "admin";

      // Fetch user profile from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          uid: firebaseUser.uid,
          email: data.email || firebaseUser.email || "",
          displayName: data.displayName || firebaseUser.displayName || "",
          photoURL: data.photoURL ?? firebaseUser.photoURL ?? null,
          role: data.role || "student",
          status: data.status || "active",
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
        } as User);
        setIsAdmin(hasAdminClaim || data.role === "admin");
      } else {
        setUserProfile(null);
        setIsAdmin(hasAdminClaim);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserProfile(null);
      setIsAdmin(false);
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // Process redirect result if coming back from signInWithRedirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await fetchUserData(result.user);
        }
      })
      .catch((err) => {
        console.warn("Redirect result handler:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserData]);

  // ── Auth actions ─────────────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    let firebaseUser: FirebaseUser | null = null;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      firebaseUser = result.user;
    } catch (popupErr: any) {
      if (popupErr?.code === "auth/popup-blocked") {
        console.warn("Popup blocked by browser, falling back to signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw popupErr;
    }

    if (!firebaseUser) return;

    // Create or sync Firestore profile
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName ?? "",
          photoURL: firebaseUser.photoURL ?? null,
          role: "student",
          status: "active",
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      }
    } catch (profileErr) {
      console.warn("Could not sync user profile in Firestore:", profileErr);
    }

    await fetchUserData(firebaseUser);
  }, [fetchUserData]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Update last login time
      const userDocRef = doc(db, "users", result.user.uid);
      await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });

      await fetchUserData(result.user);
    },
    [fetchUserData]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Set the display name on the Firebase Auth profile
      await updateProfile(result.user, { displayName });

      // Create the Firestore profile document
      const userDocRef = doc(db, "users", result.user.uid);
      await setDoc(userDocRef, {
        email,
        displayName,
        photoURL: null,
        role: "student",
        status: "active",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      await fetchUserData(result.user);
    },
    [fetchUserData]
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  // ── Value ────────────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    userProfile,
    loading,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
