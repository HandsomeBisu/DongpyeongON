import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin 환경변수가 설정되지 않았습니다.");
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => getFirestore(getAdminApp());
