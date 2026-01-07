import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AccessRequestModal from '../components/AccessRequestModal';
import PendingRequestsSection from '../components/PendingRequestsSection';
import CollaboratorManagement from '../components/CollaboratorManagement';
import YourRequestsSection from '../components/YourRequestsSection';

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
                        console.log('Generating userId for existing user...');
                        const { generateUniqueUserId } = await import('../firebase/userIdUtils');
                        const newUserId = await generateUniqueUserId();

                        // Update the user document
                        const userDocRef = snapshot.docs[0].ref;
                        await updateDoc(userDocRef, {
                            userId: newUserId
                        });

                        // Update local state with new ID
                        setUserProfile({ ...userData, userId: newUserId });
                    } else {
                        setUserProfile(userData);
                    }

                    // ALWAYS check if user has inventory (runs every time, separate from userId check)
                    const inventoriesRef = collection(db, 'inventories');
                    const invQuery = query(inventoriesRef, where('ownerId', '==', user.uid));
                    const invSnapshot = await getDocs(invQuery);

                    // Create default inventory if none exists
                    if (invSnapshot.empty) {
                        console.log('Creating default inventory with setDoc for stable ID...');
                        // Use a stable, predictable ID format that matches what we'll expect in updates
                        const inventoryId = `inv_${user.uid}_${Date.now()}`;

                        await setDoc(doc(db, 'inventories', inventoryId), {
                            id: inventoryId,
                            ownerId: user.uid,
                            name: `${user.displayName || 'My'} Inventory`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            collaborators: {}
                        });
                        console.log('✅ Created default inventory!');
                        alert('✅ Default inventory created! Refresh to see changes.');
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
            {/* Profile Card with User ID */}
            <div className="card p-6">
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

                {/* Your User ID */}
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                            Your ID
                        </span>
                        <button
                            onClick={handleCopyId}
                            className="px-3 py-1 rounded-lg bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-700 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        >
                            {copied ? '✓ Copied' : '📋 Copy'}
                        </button>
                    </div>
                    <div className="text-4xl font-black text-primary-600 dark:text-primary-400 tracking-wider font-mono">
                        {userProfile?.userId || '------'}
                    </div>
                    <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-2">
                        Share this ID with others to collaborate
                    </p>
                </div>
            </div>

            {/* Pending Requests (for owners) */}
            <PendingRequestsSection user={user} />

            {/* Your Sent Requests (for requesters) */}
            <YourRequestsSection user={user} />

            {/* Manage Existing Collaborators (for owners) */}
            <CollaboratorManagement user={user} />

            {/* Find Users */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Find Users
                </h3>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setSearchId(value);
                            setSearchResult(null);
                        }}
                        placeholder="Enter 6-digit ID"
                        maxLength={6}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg focus:border-primary-500 focus:ring-0 transition-colors"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searchId.length !== 6 || searching}
                        className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Search Results */}
                {searchResult && searchResult !== 'not_found' && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <img
                                src={searchResult.photoURL}
                                alt={searchResult.displayName}
                                className="w-12 h-12 rounded-xl"
                            />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {searchResult.displayName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                    ID: {searchResult.userId}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowRequestModal(true)}
                                className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
                            >
                                Request Access
                            </button>
                        </div>
                    </div>
                )}

                {searchResult === 'not_found' && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            No user found with ID: {searchId}
                        </p>
                    </div>
                )}
            </div>

            {/* Sign Out */}
            <div className="card p-6">
                <button
                    onClick={onLogout}
                    className="w-full px-6 py-3 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    Sign Out
                </button>
            </div>

            {/* Access Request Modal */}
            <AccessRequestModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                targetUser={searchResult}
                currentUser={user}
                onSuccess={() => {
                    alert('Request sent successfully!');
                    setSearchResult(null);
                    setSearchId('');
                }}
            />
        </div>
    );
}
