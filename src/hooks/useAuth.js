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
    browserSessionPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { generateUniqueUserId, generateInventoryId } from '../firebase/userIdUtils';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'super-admin', 'admin', 'user', or null
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rememberMe, setRememberMe] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('rememberMe') === 'true';
        }
        return false;
    });
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });
    const redirectProcessed = useRef(false);

    // The Super Admin (Owner) Email
    const SUPER_ADMIN_EMAIL = 'loading800@gmail.com';

    // Theme toggle function
    const toggleTheme = () => {
        setIsDark(prev => {
            const newValue = !prev;
            localStorage.setItem('theme', newValue ? 'dark' : 'light');
            if (newValue) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return newValue;
        });
    };

    // Apply theme on mount
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

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

            // Set persistence based on rememberMe preference
            try {
                const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
                await setPersistence(auth, persistenceMode);
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
                            // Generate unique user ID
                            const userId = await generateUniqueUserId();

                            // Create user document
                            await setDoc(userDocRef, {
                                uid: firebaseUser.uid,
                                userId: userId,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                createdAt: serverTimestamp(),
                                lastLogin: serverTimestamp()
                            });

                            // Create default inventory for new user
                            const inventoryId = generateInventoryId(firebaseUser.uid);
                            await setDoc(doc(db, 'inventories', inventoryId), {
                                id: inventoryId,
                                ownerId: firebaseUser.uid,
                                name: `${firebaseUser.displayName || 'My'} Inventory`,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp(),
                                collaborators: {}
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

    const toggleRememberMe = (value) => {
        setRememberMe(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('rememberMe', value.toString());
        }
    };

    return {
        user,
        role,
        loading,
        error,
        isDark,
        toggleTheme,
        loginWithGoogle,
        logout,
        requestAdminAccess,
        rememberMe,
        toggleRememberMe,
        isAdmin: role === 'super-admin' || role === 'admin',
        isSuperAdmin: role === 'super-admin'
    };
}
