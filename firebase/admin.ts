import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
    const apps = getApps();
    if (!apps.length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        if (!privateKey) {
            throw new Error("FIREBASE_PRIVATE_KEY is missing");
        }

        // Handle different formats of the private key
        let formattedKey = privateKey
            .replace(/\\n/gm, '\n')  // Replace literal \n with actual newlines
            .replace(/^["']|["']$/g, ''); // Remove surrounding quotes if any

        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: formattedKey,
            }),
        });
    }
    return {
        auth: getAuth(),
        db: getFirestore(),
    };
}

export const { auth, db } = initFirebaseAdmin();