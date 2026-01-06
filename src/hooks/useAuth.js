import { useState, useEffect, useRef } from 'react';
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
    onAuthStateChanged,
    getRedirectResult,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'super-admin', 'admin', 'user', or null
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const redirectProcessed = useRef(false);

    // The Super Admin (Owner) Email
    const SUPER_ADMIN_EMAIL = 'loading800@gmail.com';

    useEffect(() => {
        let unsubscribe;

        const initAuth = async () => {
            setLoading(true);

            // First, check for redirect result (only once, even in StrictMode)
            if (!redirectProcessed.current) {
                redirectProcessed.current = true;
                try {
                    const result = await getRedirectResult(auth);
                    if (result) {
                        // Login successful via redirect
                    }
                } catch (err) {
                    console.error('Auth redirect error:', err);
                    setError(err.message);
                }
            }

            // Set persistence explicitly
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (err) {
                console.error('Failed to set auth persistence:', err);
            }

            // Now set up the auth state listener
            unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

                try {
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
                } catch (err) {
                    console.error('CRITICAL: Error in onAuthStateChanged logic:', err);
                    // Even if Firestore fails, set the user so they can at least see the public view
                    if (firebaseUser) {
                        setUser(firebaseUser);
                        setRole('user');
                    }
                }
                setLoading(false);
            });
        };

        initAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const loginWithGoogle = async () => {
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
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
