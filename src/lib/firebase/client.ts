import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig, { isFirebaseConfigured } from "./config";

export function getFirebaseClient() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase 환경변수가 설정되지 않았습니다.");
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
}
