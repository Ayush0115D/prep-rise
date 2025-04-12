// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDSIuHZo2XnsoyGWzGqrwsGSP1kJOXOg14",
    authDomain: "prep-rise.firebaseapp.com",
    projectId: "prep-rise",
    storageBucket: "prep-rise.firebasestorage.app",
    messagingSenderId: "1080826867836",
    appId: "1:1080826867836:web:51b4f34d710efef3f859f9",
    measurementId: "G-ZMPLZYHVXY"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);