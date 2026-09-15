"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  isSchoolEmail,
  normalizeEmail,
  SCHOOL_EMAIL_DOMAIN,
} from "@/lib/firebase/school-email";
import {
  profileFromData,
  studentProfileSchema,
  type StudentProfileInput,
  type UserProfile,
} from "@/lib/user-profile";

type EmailAuthResult = "signed-in" | "verification-sent" | false;

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signIn: () => Promise<boolean>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<EmailAuthResult>;
  registerWithPassword: (
    email: string,
    password: string,
  ) => Promise<EmailAuthResult>;
  saveStudentProfile: (input: StudentProfileInput) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

function allowed(user: User) {
  return Boolean(user.email && isSchoolEmail(user.email) && user.emailVerified);
}

function authErrorMessage(caught: unknown, mode: "login" | "register") {
  const code =
    typeof caught === "object" && caught && "code" in caught
      ? String(caught.code)
      : "";
  if (code === "auth/email-already-in-use")
    return "이미 가입된 학교 이메일입니다. 로그인해 주세요.";
  if (code === "auth/weak-password")
    return "비밀번호는 8자 이상으로 안전하게 만들어 주세요.";
  if (code === "auth/too-many-requests")
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "auth/operation-not-allowed")
    return "Firebase Console에서 이메일/비밀번호 로그인을 활성화해 주세요.";
  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  )
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  return mode === "register"
    ? "계정을 만들지 못했습니다. 다시 시도해 주세요."
    : "로그인하지 못했습니다. 다시 시도해 주세요.";
}

async function requestVerificationCode(user: User) {
  const response = await fetch("/api/auth/email-verification/request", {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok)
    throw new Error(payload.error || "인증 코드를 보내지 못했습니다.");
}

async function ensureProfile(user: User) {
  const { db } = getFirebaseClient();
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    const initial = {
      uid: user.uid,
      displayName: user.displayName || "동평 학생",
      email: user.email,
      photoURL: user.photoURL,
      role: "general",
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, initial);
    return profileFromData(user, initial);
  }
  return profileFromData(user, snapshot.data());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const { auth } = getFirebaseClient();
    return onAuthStateChanged(auth, async (next) => {
      try {
        if (next && (!next.email || !isSchoolEmail(next.email))) {
          await firebaseSignOut(auth);
          setUser(null);
          setProfile(null);
          setError(
            `@${SCHOOL_EMAIL_DOMAIN} 학교 계정으로만 로그인할 수 있습니다.`,
          );
          return;
        }
        if (next && !next.emailVerified) {
          setUser(null);
          setProfile(null);
          return;
        }
        if (next) setProfile(await ensureProfile(next));
        else setProfile(null);
        setUser(next);
      } catch {
        setError("사용자 정보를 불러오지 못했습니다.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    const { auth } = getFirebaseClient();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: SCHOOL_EMAIL_DOMAIN,
      prompt: "select_account",
    });
    try {
      const result = await signInWithPopup(auth, provider);
      if (!allowed(result.user)) {
        await firebaseSignOut(auth);
        setError(
          `@${SCHOOL_EMAIL_DOMAIN} 학교 Google 계정으로만 로그인할 수 있습니다.`,
        );
        return false;
      }
      return true;
    } catch (caught) {
      const code =
        typeof caught === "object" && caught && "code" in caught
          ? String(caught.code)
          : "";
      if (code !== "auth/popup-closed-by-user")
        setError("로그인하지 못했습니다. 다시 시도해 주세요.");
      return false;
    }
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<EmailAuthResult> => {
      setError(null);
      const normalized = normalizeEmail(email);
      if (!isSchoolEmail(normalized)) {
        setError(
          `@${SCHOOL_EMAIL_DOMAIN}로 끝나는 학교 이메일을 입력해 주세요.`,
        );
        return false;
      }
      try {
        const { auth } = getFirebaseClient();
        const result = await signInWithEmailAndPassword(
          auth,
          normalized,
          password,
        );
        if (!result.user.emailVerified) {
          try {
            await requestVerificationCode(result.user);
            return "verification-sent";
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "인증 코드를 보내지 못했습니다.",
            );
            return false;
          } finally {
            await firebaseSignOut(auth);
          }
        }
        if (!allowed(result.user)) {
          await firebaseSignOut(auth);
          setError(
            `@${SCHOOL_EMAIL_DOMAIN} 학교 이메일로만 로그인할 수 있습니다.`,
          );
          return false;
        }
        return "signed-in";
      } catch (caught) {
        setError(authErrorMessage(caught, "login"));
        return false;
      }
    },
    [],
  );

  const registerWithPassword = useCallback(
    async (email: string, password: string): Promise<EmailAuthResult> => {
      setError(null);
      const normalized = normalizeEmail(email);
      if (!isSchoolEmail(normalized)) {
        setError(
          `@${SCHOOL_EMAIL_DOMAIN}로 끝나는 학교 이메일을 입력해 주세요.`,
        );
        return false;
      }
      try {
        const { auth } = getFirebaseClient();
        const result = await createUserWithEmailAndPassword(
          auth,
          normalized,
          password,
        );
        try {
          await requestVerificationCode(result.user);
          return "verification-sent";
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "인증 코드를 보내지 못했습니다.",
          );
          return false;
        } finally {
          await firebaseSignOut(auth);
        }
      } catch (caught) {
        setError(authErrorMessage(caught, "register"));
        return false;
      }
    },
    [],
  );

  const saveStudentProfile = useCallback(
    async (input: StudentProfileInput) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      const parsed = studentProfileSchema.parse(input);
      const { db } = getFirebaseClient();
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...parsed,
          displayName: parsed.name,
          onboardingCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await updateFirebaseProfile(user, { displayName: parsed.name });
      setProfile((current) =>
        current
          ? {
              ...current,
              ...parsed,
              displayName: parsed.name,
              onboardingCompleted: true,
            }
          : null,
      );
    },
    [user],
  );

  const signOut = useCallback(async () => {
    setError(null);
    await firebaseSignOut(getFirebaseClient().auth);
  }, []);
  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      error,
      signIn,
      signInWithPassword,
      registerWithPassword,
      saveStudentProfile,
      signOut,
    }),
    [
      user,
      profile,
      loading,
      error,
      signIn,
      signInWithPassword,
      registerWithPassword,
      saveStudentProfile,
      signOut,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider가 필요합니다.");
  return value;
}
