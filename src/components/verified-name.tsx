"use client";

import { BadgeCheck } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { isAccountSuspended } from "@/lib/account-suspension";
import { getFirebaseClient } from "@/lib/firebase/client";

const VerifiedUsersContext = createContext<ReadonlySet<string>>(new Set());
const EMPTY_VERIFIED_USERS: ReadonlySet<string> = new Set();

export function VerifiedUsersProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [verificationState, setVerificationState] = useState<{
    ownerUid: string;
    users: ReadonlySet<string>;
  }>({ ownerUid: "", users: EMPTY_VERIFIED_USERS });
  const canRead = Boolean(
    user &&
      profile?.onboardingCompleted &&
      !isAccountSuspended(profile.suspension),
  );

  useEffect(() => {
    if (!user || !canRead) return;
    return onSnapshot(
      collection(getFirebaseClient().db, "verifiedUsers"),
      (snapshot) =>
        setVerificationState({
          ownerUid: user.uid,
          users: new Set(snapshot.docs.map((doc) => doc.id)),
        }),
      () =>
        setVerificationState({
          ownerUid: user.uid,
          users: EMPTY_VERIFIED_USERS,
        }),
    );
  }, [canRead, user]);

  const verifiedUsers =
    canRead && user && verificationState.ownerUid === user.uid
      ? verificationState.users
      : EMPTY_VERIFIED_USERS;

  return (
    <VerifiedUsersContext.Provider value={verifiedUsers}>
      {children}
    </VerifiedUsersContext.Provider>
  );
}

export function useIsVerified(userId: string | null | undefined) {
  const verifiedUsers = useContext(VerifiedUsersContext);
  return Boolean(userId && verifiedUsers.has(userId));
}

export function VerifiedName({
  name,
  userId,
  verified,
  className = "",
  badgeClassName = "",
}: {
  name: string;
  userId?: string | null;
  verified?: boolean;
  className?: string;
  badgeClassName?: string;
}) {
  const liveVerified = useIsVerified(userId);
  const showBadge = verified ?? liveVerified;
  const label = useMemo(
    () => (showBadge ? `${name}, 인증된 사용자` : name),
    [name, showBadge],
  );

  return (
    <span className={`inline-flex min-w-0 items-center gap-1 ${className}`} aria-label={label}>
      <span className="min-w-0 truncate">{name}</span>
      {showBadge && <VerificationBadge className={badgeClassName} />}
    </span>
  );
}

export function VerificationBadge({ className = "" }: { className?: string }) {
  return (
    <BadgeCheck
      aria-label="인증된 사용자"
      size={16}
      fill="#007aff"
      className={`shrink-0 text-white ${className}`}
      strokeWidth={2.5}
    />
  );
}
