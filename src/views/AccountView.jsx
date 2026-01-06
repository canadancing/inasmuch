import { useState } from 'react';

export default function AccountView({ user, role, onLogin, onLogout, requestAdminAccess, isDark }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const handleRequestAdmin = async () => {
        setIsSubmitting(true);
        try {
            await requestAdminAccess();
            setRequestSent(true);
        } catch (error) {
            console.error('Error requesting admin:', error);
        } finally {
            setIsSubmitting(false);
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
                    Sign in with your Google account to log usage, manage supplies, and customize your experience.
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
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Profile Card */}
            <div className="card p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-accent-500 to-primary-600 opacity-50" />

                <div className="relative z-10">
                    <div className="inline-block relative mb-6">
                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-red-500 to-green-500 shadow-xl transition-transform group-hover:scale-105">
                            <div className="w-full h-full rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center border border-gray-100 dark:border-gray-700">
                            <span className="text-lg">✨</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{user.displayName || 'Anonymous User'}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">{user.email}</p>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <span className={`w-2 h-2 rounded-full ${role === 'super-admin' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : role === 'admin' ? 'bg-primary-500' : 'bg-gray-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 dark:text-gray-300">
                            {role || 'Viewer'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Role & Permissions Section */}
            {role !== 'super-admin' && role !== 'admin' && (
                <div className="card p-6 border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">🛡️</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Upgrade your account</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Apply to become a Co-Admin to help manage residents, items, and log supply usage.
                            </p>
                            <button
                                onClick={handleRequestAdmin}
                                disabled={requestSent || isSubmitting}
                                className={`btn w-full ${requestSent
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'btn-primary shadow-primary-500/20'
                                    } shadow-lg`}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : requestSent ? (
                                    'Application Sent! ✓'
                                ) : (
                                    'Apply for Co-Admin'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Section */}
            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-6">Account Settings</p>
                <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 transition-transform group-hover:rotate-12">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">Sign Out</p>
                                <p className="text-xs text-gray-500">Sign out of your Inasmuch account</p>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <p className="text-center text-[10px] text-gray-400 font-medium pb-8 uppercase tracking-widest">
                Account secured by Firebase Authentication
            </p>
        </div>
    );
}
