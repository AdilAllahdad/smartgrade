// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPGItDeGkQdRdE2YTRl7DNJjCKW47HMY0",
  authDomain: "ai-exam-evaluation-system.firebaseapp.com",
  projectId: "ai-exam-evaluation-system",
  storageBucket: "ai-exam-evaluation-system.firebasestorage.app",
  messagingSenderId: "999489044025",
  appId: "1:999489044025:web:69f14a52f302b5fc93d7e8",
  measurementId: "G-4FMM7EY0S3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, analytics };