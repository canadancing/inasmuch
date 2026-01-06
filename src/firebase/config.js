// Firebase configuration
// Replace these values with your Firebase project config
// See FIREBASE_SETUP.md for instructions

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDeoz2takCZM00ycA87NQOogpLutxZsA9s",
    authDomain: "inasmuch-909c7.firebaseapp.com",
    projectId: "inasmuch-909c7",
    storageBucket: "inasmuch-909c7.firebasestorage.app",
    messagingSenderId: "984547364434",
    appId: "1:984547364434:web:1caed19d0d50cd5d89d98b",
    measurementId: "G-T7ZVHL5G5D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection references
export const residentsRef = collection(db, 'residents');
export const itemsRef = collection(db, 'items');
export const logsRef = collection(db, 'logs');

// Helper functions
export {
    db,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    getDocs,
    writeBatch
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "YOUR_API_KEY";
};
