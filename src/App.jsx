import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFirestore } from './hooks/useFirestore';
import { useCustomIcons } from './hooks/useCustomIcons';
import { useTags } from './hooks/useTags';
import ThemeToggle from './components/ThemeToggle';
import ResidentView from './views/ResidentView';
import AdminView from './views/AdminView';
import { useAuth } from './hooks/useAuth';

export default function App() {
    const [currentView, setCurrentView] = useState('resident');
    const { isDark, toggleTheme } = useTheme();
    const {
        residents,
        items,
        logs,
        loading,
        error,
        isDemo,
        addLog,
        addResident,
        updateResident,
        removeResident,
        addItem,
        updateItem,
        removeItem,
        deleteLog,
        updateLog,
        restockItem,
        updateUserRole
    } = useFirestore();

    const {
        user,
        role,
        loading: authLoading,
        loginWithGoogle,
        logout,
        isAdmin,
        isSuperAdmin,
        requestAdminAccess
    } = useAuth();

    const {
        customIcons,
        addCustomIcon,
        updateCustomIcon,
        removeCustomIcon,
        customIconsMap
    } = useCustomIcons();

    const {
        tags,
        tagsMap,
        tagColors,
        addTag,
        updateTag,
        removeTag,
        getTagStyles
    } = useTags();

    const navItems = [
        { id: 'resident', label: 'Log', icon: '📝' },
        { id: 'admin', label: 'Admin', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
            {/* Floating Theme Toggle */}
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-12 pb-36 animate-fade-in">
                {authLoading || loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Preparing tracker...</p>
                    </div>
                ) : !user ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-4xl shadow-2xl mb-8 animate-float">
                            I
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Welcome to Inasmuch</h1>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-10">
                            Please sign in with your Google account to access the supply tracker.
                        </p>
                        <button
                            onClick={loginWithGoogle}
                            className="btn btn-primary px-8 py-4 text-lg flex items-center gap-3 shadow-xl shadow-primary-500/20"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8 animate-fade-in">
                            <div className="flex items-center gap-3">
                                {user.photoURL && (
                                    <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-md" />
                                )}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Signed in as</p>
                                    <p className="font-bold text-gray-900 dark:text-white leading-tight">{user.displayName || user.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest"
                            >
                                Sign Out
                            </button>
                        </div>

                        {currentView === 'resident' && (
                            <ResidentView
                                residents={residents}
                                items={items}
                                onLog={(resId, resName, itemId, itemName, action, qty, date) => addLog(resId, resName, itemId, itemName, action, qty, date, user)}
                                loading={loading}
                                isDemo={isDemo}
                                isAdmin={isAdmin}
                                requestAdminAccess={requestAdminAccess}
                                role={role}
                            />
                        )}
                        {currentView === 'admin' && (
                            <AdminView
                                residents={residents}
                                items={items}
                                logs={logs}
                                loading={loading}
                                isDemo={isDemo}
                                isDark={isDark}
                                onAddResident={addResident}
                                onUpdateResident={updateResident}
                                onRemoveResident={removeResident}
                                onAddItem={addItem}
                                onUpdateItem={updateItem}
                                onRemoveItem={removeItem}
                                onRestock={(itemId, itemName, qty, resId, resName, date) => restockItem(itemId, itemName, qty, resId, resName, date, user)}
                                onDeleteLog={deleteLog}
                                onUpdateLog={updateLog}
                                customIcons={customIcons}
                                onAddCustomIcon={addCustomIcon}
                                onUpdateCustomIcon={updateCustomIcon}
                                onRemoveCustomIcon={removeCustomIcon}
                                customIconsMap={customIconsMap}
                                tags={tags}
                                tagsMap={tagsMap}
                                tagColors={tagColors}
                                onAddTag={addTag}
                                onUpdateTag={updateTag}
                                onRemoveTag={removeTag}
                                getTagStyles={getTagStyles}
                                user={user}
                                isSuperAdmin={isSuperAdmin}
                                onUpdateUserRole={updateUserRole}
                            />
                        )}
                    </>
                )}
            </main>

            {user && (
                /* macOS Floating Dock */
                <nav className="nav-dock">
                    {/* Active Bubble Indicator */}
                    <div
                        className="nav-bubble"
                        style={{
                            width: `calc(100% / ${navItems.length} - 8px)`,
                            transform: `translateX(${currentView === 'resident' ? '0' : '100%'})`,
                            left: '4px'
                        }}
                    />

                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`relative z-10 flex flex-col items-center justify-center gap-1.5 px-6 py-2 rounded-3xl min-w-[90px] transition-all duration-300 group`}
                        >
                            <span className={`text-2xl transition-all duration-500 ${currentView === item.id
                                ? 'scale-110 -translate-y-1 drop-shadow-lg'
                                : 'group-hover:scale-110 group-hover:-translate-y-0.5 opacity-60'
                                }`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${currentView === item.id
                                ? 'text-primary-600 dark:text-primary-300 opacity-100'
                                : 'text-gray-400 dark:text-gray-500 opacity-60 group-hover:opacity-100'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>
            )}
        </div>
    );
}
