import { useState, useEffect } from 'react';
import {
    auth,
    googleProvider,
    db,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from '../firebase/config';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'super-admin', 'admin', 'user', or null
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // The Super Admin (Owner) Email
    const SUPER_ADMIN_EMAIL = 'elonhsiao@gmail.com'; // Placeholder - will be updated based on user context or hardcoded if requested

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                // Get or create user profile in Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);

                let userRole = 'user'; // Default role

                if (firebaseUser.email === SUPER_ADMIN_EMAIL) {
                    userRole = 'super-admin';
                } else if (userDoc.exists()) {
                    userRole = userDoc.data().role || 'user';
                }

                // If user doesn't exist in Firestore, create them
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        role: userRole,
                        requestPending: false,
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp()
                    });
                } else {
                    // Update last login
                    await setDoc(userDocRef, {
                        lastLogin: serverTimestamp()
                    }, { merge: true });
                }

                setUser(firebaseUser);
                setRole(userRole);
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const requestAdminAccess = async () => {
        if (!user) return;
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                requestPending: true,
                requestedAt: serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.error('Error requesting admin access:', err);
        }
    };

    return {
        user,
        role,
        loading,
        error,
        loginWithGoogle,
        logout,
        requestAdminAccess,
        isAdmin: role === 'super-admin' || role === 'admin',
        isSuperAdmin: role === 'super-admin'
    };
}
