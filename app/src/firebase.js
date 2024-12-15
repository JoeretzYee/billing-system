import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
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
  addDoc,
  collection,
  createUserWithEmailAndPassword,
  db,
  deleteDoc,
  deleteUser,
  doc,
  getAuth,
  getDoc,
  getDocs,
  onAuthStateChanged,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  signInWithEmailAndPassword,
  signOut,
  updateDoc,
  where,
  writeBatch,
};
