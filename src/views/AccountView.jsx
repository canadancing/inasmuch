import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useInventory } from '../context/InventoryContext';
import AccessRequestModal from '../components/AccessRequestModal';
import PendingRequestsSection from '../components/PendingRequestsSection';
import YourRequestsSection from '../components/YourRequestsSection';
import NotificationsSection from '../components/NotificationsSection';
import CollaboratorList from '../components/CollaboratorList';
import DataManagement from '../components/DataManagement';
import InventoryNicknameModal from '../components/InventoryNicknameModal';
import AuthForm from '../components/AuthForm';
import UserAvatar from '../components/UserAvatar';

export default function AccountView({ user, onLogin, onLoginWithEmail, onRegister, onLinkGoogle, onLinkEmail, onUnlinkGoogle, onUnlinkEmail, onLogout, error }) {
    const { currentInventory } = useInventory();
    const [userProfile, setUserProfile] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

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

    const handleAuthSubmit = async ({ email, password, displayName, mode }) => {
        setAuthLoading(true);
        setLocalError(null);
        try {
            if (mode === 'register') {
                await onRegister(email, password, displayName);
            } else {
                await onLoginWithEmail(email, password);
            }
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setAuthLoading(true);
        setLocalError(null);
        try {
            await onLogin();
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLinkEmail = async ({ email, password }) => {
        setAuthLoading(true);
        setLocalError(null);
        try {
            await onLinkEmail(email, password);
            setIsLinking(false);
        } catch (err) {
            if (err.code === 'auth/credential-already-in-use') {
                setLocalError('This Google account is already linked to another account. Please sign out and sign in with Google instead.');
            } else if (err.code === 'auth/email-already-in-use') {
                setLocalError('This email is already in use by another account.');
            } else {
                setLocalError(err.message);
            }
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLinkGoogle = async () => {
        setAuthLoading(true);
        setLocalError(null);
        try {
            await onLinkGoogle();
        } catch (err) {
            console.error('Linking error (Google):', err);
            // Handle the specific case where Google account is already linked to another account
            if (err.code === 'auth/credential-already-in-use') {
                setLocalError('This Google account is already linked to another account. Please sign out and sign in with Google instead.');
            } else if (err.code === 'auth/provider-already-linked') {
                setLocalError('A Google account is already linked to this account.');
            } else {
                setLocalError(err.message);
            }
        } finally {
            setAuthLoading(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!confirm('Are you sure you want to unlink your Google account? You will need another sign-in method to access your account.')) return;
        setAuthLoading(true);
        setLocalError(null);
        try {
            await onUnlinkGoogle();
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleUnlinkEmail = async () => {
        if (!confirm('Are you sure you want to unlink your password? You will need another sign-in method to access your account.')) return;
        setAuthLoading(true);
        setLocalError(null);
        try {
            await onUnlinkEmail();
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setAuthLoading(false);
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

    const isGoogleLinked = user?.providerData?.some(p => p.providerId === 'google.com');
    const isEmailLinked = user?.providerData?.some(p => p.providerId === 'password');

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 animate-fade-in">
                <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-4xl shadow-2xl mb-8 animate-float">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 008.384-4.51m-2.408-4.46A3 3 0 0120 9a3 3 0 10-5.997-.188m-5.012 0a3 3 0 10-5.998.188A3 3 0 0110 9c0 1.657-1.343 3-3 3s-3-1.343-3-3a3 3 0 013-3 3 3 0 013 3z" />
                    </svg>
                </div>

                <AuthForm
                    onSubmit={handleAuthSubmit}
                    onGoogleLogin={handleGoogleLogin}
                    loading={authLoading}
                    error={localError || error}
                />
            </div>
        );
    }



    return (
        <div className="max-w-2xl mx-auto space-y-4 animate-fade-in px-4">
            {/* Profile Card with User ID & Integration */}
            <div className="card overflow-hidden !rounded-[2rem]">
                <div className="p-6">
                    <div className="flex items-center gap-4">
                        <UserAvatar user={user} size="lg" className="shadow-lg" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight truncate">
                                    {user.displayName || 'Unnamed User'}
                                </h2>
                                <button
                                    onClick={handleCopyId}
                                    className="group/id relative px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                    title="Click to copy User ID"
                                >
                                    <span className="font-mono tracking-wider">#{userProfile?.userId || '---'}</span>
                                    {copied && (
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded-lg animate-fade-in-up whitespace-nowrap">
                                            Copied!
                                        </span>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user.email?.endsWith('@inasmuch.local')
                                    ? user.email.split('@')[0]
                                    : user.email}
                            </p>
                        </div>
                    </div>
                </div>
            </div>



            {/* Collaborators Section */}
            <div className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-black rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">

                {/* Search Bar */}
                <div className="relative group/search mb-4">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <svg className={`w-4 h-4 transition-colors duration-300 ${searching ? 'text-primary-500 animate-spin' : 'text-gray-400 group-focus-within/search:text-primary-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setSearchId(value);
                            setSearchResult(null);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Find collaborators by ID..."
                        maxLength={6}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-primary-500/30 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold tracking-tight shadow-sm transition-all duration-500 placeholder:text-gray-400 outline-none"
                    />
                    {searchId.length === 6 && !searching && !searchResult && (
                        <button
                            onClick={handleSearch}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 active:scale-95 transition-all"
                        >
                            Find
                        </button>
                    )}
                </div>

                {/* Search Result Peek */}
                {searchResult && searchResult !== 'not_found' && (
                    <div className="mb-6 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-primary-100 dark:border-primary-800 shadow-lg animate-scale-in flex items-center gap-3">
                        <UserAvatar user={searchResult} size="md" />
                        <div className="flex-1">
                            <p className="text-xs font-black text-gray-900 dark:text-white">{searchResult.displayName}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {searchResult.userId}</p>
                        </div>
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-primary-500 text-white text-[9px] font-black uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all"
                        >
                            Connect
                        </button>
                    </div>
                )}

                {searchResult === 'not_found' && (
                    <div className="mb-6 p-3 rounded-2xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-center">
                        <p className="text-[10px] font-bold text-red-500">No user found with ID {searchId}</p>
                    </div>
                )}

                <CollaboratorList user={user} />
            </div>

            {/* Security & Integrations */}
            <div className="card !rounded-[2rem] overflow-hidden">
                <div className="p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 1.56.322 3.044.908 4.391a11.969 11.969 0 005.657 5.76c.612.29 1.257.514 1.935.666a1.191 1.191 0 00.414 0c.678-.152 1.323-.376 1.935-.666a11.969 11.969 0 005.657-5.76c.586-1.347.908-2.831.908-4.391 0-1.246-.19-2.447-.542-3.58A11.959 11.959 0 0112 2.714z" />
                        </svg>
                        Security & Integrations
                    </h3>

                    {/* Error Display */}
                    {localError && (
                        <div className="mb-4 p-4 rounded-2xl bg-red-50/80 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-slide-down">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400">{localError}</p>
                                </div>
                                <button
                                    onClick={() => setLocalError(null)}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Google Integration */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-primary-500/10 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900 dark:text-white">Google Account</p>
                                    {isGoogleLinked && user?.email ? (
                                        <>
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Connected</p>
                                            <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                                        </>
                                    ) : (
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Not Linked</p>
                                    )}
                                </div>
                            </div>
                            {isGoogleLinked ? (
                                <button
                                    onClick={handleUnlinkGoogle}
                                    disabled={authLoading || !isEmailLinked}
                                    className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border-2 border-red-100 dark:border-red-900/30 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!isEmailLinked ? 'Cannot unlink - you must have at least one sign-in method' : ''}
                                >
                                    {authLoading ? 'Processing...' : 'Unlink'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleLinkGoogle}
                                    className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
                                >
                                    Link
                                </button>
                            )}
                        </div>

                        {/* Password Integration */}
                        <div className="flex flex-col gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-primary-500/10 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 dark:text-white">Email & Password</p>
                                        {isEmailLinked && user?.email ? (
                                            <>
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Configured</p>
                                                <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                                            </>
                                        ) : (
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">No Password Set</p>
                                        )}
                                    </div>
                                </div>
                                {isEmailLinked ? (
                                    <button
                                        onClick={handleUnlinkEmail}
                                        disabled={authLoading || !isGoogleLinked}
                                        className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border-2 border-red-100 dark:border-red-900/30 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!isGoogleLinked ? 'Cannot unlink - you must have at least one sign-in method' : ''}
                                    >
                                        {authLoading ? 'Processing...' : 'Unlink'}
                                    </button>
                                ) : (
                                    !isLinking && (
                                        <button
                                            onClick={() => setIsLinking(true)}
                                            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
                                        >
                                            Setup
                                        </button>
                                    )
                                )}    </div>

                            {isLinking && (
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 animate-slide-down">
                                    <p className="text-[10px] font-bold text-gray-500 mb-4 px-1">
                                        Enter credentials to link a password to your account.
                                    </p>
                                    <AuthForm
                                        mode="link"
                                        onSubmit={handleLinkEmail}
                                        loading={authLoading}
                                        error={localError}
                                    />
                                    <button
                                        onClick={() => setIsLinking(false)}
                                        className="w-full mt-2 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Management & Requests Sections */}
            <NotificationsSection user={user} />
            <PendingRequestsSection user={user} />
            <YourRequestsSection user={user} />

            {/* Data Backup & Restore */}
            <div className="p-4 rounded-3xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
                <DataManagement user={user} />
            </div>

            {/* Standard Sign Out */}
            <div className="flex justify-center pt-2">
                <button
                    onClick={onLogout}
                    className="px-6 py-2.5 rounded-xl border border-red-100 dark:border-red-900/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center gap-2 active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

            <InventoryNicknameModal
                isOpen={showNicknameModal}
                onClose={() => setShowNicknameModal(false)}
                target={currentInventory}
                type={currentInventory?.isOwner ? 'public' : 'private'}
                onSuccess={() => {
                    // Context update handles the refresh
                }}
            />
        </div>
    );
}
