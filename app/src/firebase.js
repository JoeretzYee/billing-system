import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  doc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  where,
  query,
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdbaly9fKISkVh5iuxsJPEX3qeskjK4ls",
  authDomain: "billing-system-688de.firebaseapp.com",
  projectId: "billing-system-688de",
  storageBucket: "billing-system-688de.firebasestorage.app",
  messagingSenderId: "192238039369",
  appId: "1:192238039369:web:171531ae441d040415aa98",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDoc,
  getDocs,
  signOut,
  doc,
  deleteDoc,
  onSnapshot,
  setDoc,
  writeBatch,
  deleteUser,
  where,
  updateDoc,
  onAuthStateChanged,
  query,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
};
