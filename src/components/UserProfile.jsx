import { useState, useRef, useEffect } from 'react';

export default function UserProfile({ user, role, onLogin, onLogout, isDark }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) {
        return (
            <button
                onClick={onLogin}
                className="btn btn-primary px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
            >
                Sign In
            </button>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative group transition-all active:scale-90"
            >
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 via-red-500 to-green-500 transition-transform group-hover:rotate-12">
                    <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-950 overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                {user.displayName?.charAt(0) || user.email?.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-[28px] shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] overflow-hidden animate-scale-in origin-top-right">
                    <div className="p-6 pb-2 text-center">
                        <p className="text-xs font-bold text-gray-500 mb-4">{user.email}</p>

                        <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-blue-500 via-red-500 to-green-500">
                                <div className="w-full h-full rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="" className="w-full h-full object-cover shadow-inner" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                            {user.displayName?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Hi, {user.displayName?.split(' ')[0] || 'Friend'}!</h3>
                                <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    <span className={`w-1.5 h-1.5 rounded-full ${role === 'super-admin' ? 'bg-amber-500' : role === 'admin' ? 'bg-primary-500' : 'bg-gray-400'}`} />
                                    {role || 'Viewer'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 space-y-1">
                        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4 my-2" />

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-2xl"
                        >
                            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out of Inasmuch
                        </button>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/30 text-center">
                        <p className="text-[10px] text-gray-400 font-medium">
                            Google Account secured by Firebase
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
