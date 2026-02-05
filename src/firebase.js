// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANUNCE0GtOauGJ28PBZJVv0KfHBVz_128",
  authDomain: "milleave-44431.firebaseapp.com",
  projectId: "milleave-44431",
  storageBucket: "milleave-44431.firebasestorage.app",
  messagingSenderId: "570981227990",
  appId: "1:570981227990:web:c981fe88366e71409b1877"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
