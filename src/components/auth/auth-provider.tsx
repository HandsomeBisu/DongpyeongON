"use client";

import { GoogleAuthProvider, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { EMAIL_FOR_SIGN_IN_KEY, isSchoolEmail, normalizeEmail, SCHOOL_EMAIL_DOMAIN } from "@/lib/firebase/school-email";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signIn: () => Promise<boolean>;
  sendEmailLink: (email: string) => Promise<boolean>;
  completeEmailSignIn: (email: string, link: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

function allowed(user: User) {
  return Boolean(user.email && isSchoolEmail(user.email));
}

async function ensureProfile(user: User) {
  const { db } = getFirebaseClient();
  const ref = doc(db, "users", user.uid);
  if (!(await getDoc(ref)).exists()) {
    await setDoc(ref, { uid: user.uid, displayName: user.displayName || "동평 학생", email: user.email, photoURL: user.photoURL, role: "student", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const { auth } = getFirebaseClient();
    return onAuthStateChanged(auth, async (next) => {
      try {
        if (next && !allowed(next)) { await firebaseSignOut(auth); setUser(null); setError(`@${SCHOOL_EMAIL_DOMAIN} 학교 계정으로만 로그인할 수 있습니다.`); return; }
        if (next) await ensureProfile(next);
        setUser(next);
      } catch { setError("사용자 정보를 불러오지 못했습니다."); setUser(null); }
      finally { setLoading(false); }
    });
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    const { auth } = getFirebaseClient();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: SCHOOL_EMAIL_DOMAIN, prompt: "select_account" });
    try {
      const result = await signInWithPopup(auth, provider);
      if (!allowed(result.user)) {
        await firebaseSignOut(auth);
        setError(`@${SCHOOL_EMAIL_DOMAIN} 학교 Google 계정으로만 로그인할 수 있습니다.`);
        return false;
      }
      return true;
    } catch (caught) {
      const code = typeof caught === "object" && caught && "code" in caught ? String(caught.code) : "";
      if (code !== "auth/popup-closed-by-user") setError("로그인하지 못했습니다. 다시 시도해 주세요.");
      return false;
    }
  }, []);

  const sendEmailLink = useCallback(async (email: string) => {
    setError(null);
    const normalized = normalizeEmail(email);
    if (!isSchoolEmail(normalized)) {
      setError(`@${SCHOOL_EMAIL_DOMAIN}로 끝나는 학교 이메일을 입력해 주세요.`);
      return false;
    }
    try {
      await sendSignInLinkToEmail(getFirebaseClient().auth, normalized, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, normalized);
      return true;
    } catch (caught) {
      const code = typeof caught === "object" && caught && "code" in caught ? String(caught.code) : "";
      setError(code === "auth/operation-not-allowed" ? "Firebase Console에서 이메일 링크 로그인을 먼저 활성화해 주세요." : "인증 이메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return false;
    }
  }, []);

  const completeEmailSignIn = useCallback(async (email: string, link: string) => {
    setError(null);
    const normalized = normalizeEmail(email);
    if (!isSchoolEmail(normalized)) {
      setError(`@${SCHOOL_EMAIL_DOMAIN}로 끝나는 학교 이메일을 입력해 주세요.`);
      return false;
    }
    try {
      const result = await signInWithEmailLink(getFirebaseClient().auth, normalized, link);
      if (!allowed(result.user)) {
        await firebaseSignOut(getFirebaseClient().auth);
        setError(`@${SCHOOL_EMAIL_DOMAIN} 학교 이메일로만 로그인할 수 있습니다.`);
        return false;
      }
      window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
      return true;
    } catch {
      setError("인증 링크가 만료되었거나 올바르지 않습니다. 로그인 페이지에서 다시 요청해 주세요.");
      return false;
    }
  }, []);

  const signOut = useCallback(async () => { setError(null); await firebaseSignOut(getFirebaseClient().auth); }, []);
  const value = useMemo(() => ({ user, loading, configured: isFirebaseConfigured, error, signIn, sendEmailLink, completeEmailSignIn, signOut }), [user, loading, error, signIn, sendEmailLink, completeEmailSignIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("AuthProvider가 필요합니다."); return value; }
