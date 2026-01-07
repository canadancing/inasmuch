import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AccessRequestModal from '../components/AccessRequestModal';
import PendingRequestsSection from '../components/PendingRequestsSection';
import YourRequestsSection from '../components/YourRequestsSection';
import NotificationsSection from '../components/NotificationsSection';
import CollaboratorList from '../components/CollaboratorList';

export default function AccountView({ user, onLogin, onLogout }) {
    const [userProfile, setUserProfile] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

    // Fetch user profile with userId AND ensure inventory exists
    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('uid', '==', user.uid));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const userData = snapshot.docs[0].data();

                    // Backfill: If user doesn't have userId, generate one now
                    if (!userData.userId) {
                        const { generateUniqueUserId } = await import('../firebase/userIdUtils');
                        const newUserId = await generateUniqueUserId();

                        const userDocRef = snapshot.docs[0].ref;
                        await updateDoc(userDocRef, {
                            userId: newUserId
                        });

                        setUserProfile({ ...userData, userId: newUserId });
                    } else {
                        setUserProfile(userData);
                    }

                    const inventoriesRef = collection(db, 'inventories');
                    const invQuery = query(inventoriesRef, where('ownerId', '==', user.uid));
                    const invSnapshot = await getDocs(invQuery);

                    if (invSnapshot.empty) {
                        const inventoryId = `inv_${user.uid}_${Date.now()}`;
                        await setDoc(doc(db, 'inventories', inventoryId), {
                            id: inventoryId,
                            ownerId: user.uid,
                            name: `${user.displayName || 'My'} Inventory`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            collaborators: {}
                        });
                    }
                }
            };
            fetchProfile();
        }
    }, [user]);

    const handleCopyId = async () => {
        if (userProfile?.userId) {
            await navigator.clipboard.writeText(userProfile.userId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSearch = async () => {
        if (!searchId || searchId.length !== 6) return;

        setSearching(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('userId', '==', searchId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const foundUser = snapshot.docs[0].data();
                setSearchResult({
                    uid: foundUser.uid,
                    userId: foundUser.userId,
                    displayName: foundUser.displayName,
                    photoURL: foundUser.photoURL
                });
            } else {
                setSearchResult('not_found');
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-5xl shadow-2xl mb-8 animate-float">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Welcome to Inasmuch</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-xs mx-auto">
                    Sign in to manage your inventory and collaborate with others.
                </p>
                <button
                    onClick={onLogin}
                    className="btn btn-primary px-10 py-4 text-lg flex items-center gap-3 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Profile Card with User ID & Integration */}
            <div className="card overflow-hidden">
                <div className="p-6 pb-0">
                    <div className="flex items-center gap-4 mb-6">
                        <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-20 h-20 rounded-2xl shadow-lg"
                        />
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                {user.displayName}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                            </p>
                        </div>
                    </div>

                    {/* Unified Identity & Search Section */}
                    <div className="bg-gradient-to-br from-primary-50 via-white/40 to-accent-50 dark:from-primary-900/30 dark:via-gray-900/20 dark:to-accent-900/30 rounded-[2.5rem] p-8 border border-white/60 dark:border-primary-800/50 shadow-inner relative group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500/70 dark:text-primary-400/70">
                                    Your Identity
                                </span>
                            </div>
                            <button
                                onClick={handleCopyId}
                                className="group/btn relative px-4 py-1.5 rounded-2xl bg-white dark:bg-gray-800 border border-primary-100 dark:border-primary-800 text-[10px] font-black uppercase tracking-widest text-primary-500 hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm overflow-hidden"
                            >
                                <span className="relative z-10">{copied ? '✓ Copied' : '📋 Copy ID'}</span>
                                <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                            </button>
                        </div>

                        <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-8 font-mono">
                            {userProfile?.userId || '------'}
                        </div>

                        {/* Integrated Search Bar - Apple Style */}
                        <div className="relative group/search">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <svg className={`w-5 h-5 transition-colors duration-300 ${searching ? 'text-primary-500 animate-spin' : 'text-gray-400 group-focus-within/search:text-primary-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setSearchId(value);
                                    if (value.length === 6 && value !== searchId) {
                                        // Auto-search could go here or wait for enter
                                    }
                                    setSearchResult(null);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Enter a 6-digit ID to find collaborators..."
                                maxLength={6}
                                className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white/60 dark:bg-black/20 backdrop-blur-xl border-2 border-transparent focus:border-primary-500/30 focus:bg-white dark:focus:bg-black/40 text-gray-900 dark:text-white font-bold tracking-tight shadow-lg shadow-black/5 transition-all duration-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
                            />
                            {searchId.length === 6 && !searching && !searchResult && (
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 px-4 rounded-2xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
                                >
                                    Find
                                </button>
                            )}
                        </div>

                        {/* Search Result Peek */}
                        {searchResult && searchResult !== 'not_found' && (
                            <div className="mt-4 p-4 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-primary-100 dark:border-primary-800 shadow-xl animate-scale-in flex items-center gap-4">
                                <img src={searchResult.photoURL} className="w-12 h-12 rounded-2xl shadow-md" alt="" />
                                <div className="flex-1">
                                    <p className="font-black text-gray-900 dark:text-white">{searchResult.displayName}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {searchResult.userId}</p>
                                </div>
                                <button
                                    onClick={() => setShowRequestModal(true)}
                                    className="px-5 py-2.5 rounded-2xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary-500/30 active:scale-95 transition-all"
                                >
                                    Connect
                                </button>
                            </div>
                        )}

                        {searchResult === 'not_found' && (
                            <div className="mt-4 p-4 rounded-3xl bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-center animate-shake">
                                <p className="text-xs font-bold text-red-500">User not found with ID: {searchId}</p>
                            </div>
                        )}

                        {/* Collaborator Relationship List inside ID Card */}
                        <CollaboratorList user={user} />
                    </div>
                </div>
                <div className="h-4" />
            </div>

            {/* Application Sections */}
            <NotificationsSection user={user} />
            <PendingRequestsSection user={user} />
            <YourRequestsSection user={user} />

            {/* Sign Out Card */}
            <div className="card p-6 group">
                <button
                    onClick={onLogout}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-red-100 dark:border-red-900/20 text-red-500 font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                </button>
            </div>

            <AccessRequestModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                targetUser={searchResult}
                currentUser={user}
                onSuccess={() => {
                    setSearchResult(null);
                    setSearchId('');
                }}
            />
        </div>
    );
}
