import { useState } from 'react';
import ItemGrid from '../components/ItemGrid';
import LogUsageModal from '../components/LogUsageModal';

export default function ResidentView({
    residents,
    items,
    onLog,
    loading,
    isDemo,
    isAdmin,
    user,
    onLogin
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header / Brand */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                        I
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tight text-gray-900 dark:text-white leading-none uppercase">Inasmuch</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400 font-bold mt-1">Supply Tracker</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isAdmin && (
                        <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Read Only</span>
                        </div>
                    )}
                    {isDemo && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Demo</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Current Inventory
                    </h2>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                        {items.length} items
                    </div>
                </div>
                <ItemGrid
                    items={items}
                    selectedItem={null}
                    onSelectItem={() => { }}
                    showStockOnly={true}
                />
            </div>

            {/* Floating + Button */}
            {user && isAdmin && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="fixed bottom-24 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center z-50 animate-scale-in"
                    style={{ animationDelay: '200ms' }}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}

            {/* Login Prompt for Guest Users */}
            {!user && (
                <div className="fixed bottom-24 right-8 max-w-xs animate-fade-in">
                    <div className="card p-4 shadow-2xl border-primary-100 dark:border-primary-900/30">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Sign in to log usage and manage supplies
                        </p>
                        <button
                            onClick={onLogin}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign In with Google
                        </button>
                    </div>
                </div>
            )}

            {/* Log Usage Modal */}
            <LogUsageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                residents={residents}
                items={items}
                onLog={onLog}
                user={user}
            />
        </div>
    );
}
