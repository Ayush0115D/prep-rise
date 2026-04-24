import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCWM5NmvmnvJ_0nyY-sIahi6oBGDPKb5Zg",
    authDomain: "prep-rise-b5289.firebaseapp.com",
    projectId: "prep-rise-b5289",
    storageBucket: "prep-rise-b5289.firebasestorage.app",
    messagingSenderId: "976978799692",
    appId: "1:976978799692:web:104bdb4d8697b2e16758e9"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);