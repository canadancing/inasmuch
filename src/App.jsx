import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFirestore } from './hooks/useFirestore';
import { useCustomIcons } from './hooks/useCustomIcons';
import { useTags } from './hooks/useTags';
import ThemeToggle from './components/ThemeToggle';
import ResidentView from './views/ResidentView';
import AdminView from './views/AdminView';
import AccountView from './views/AccountView';
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
        updateUserRole,
        users
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
        { id: 'account', label: 'Account', icon: '👤' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
            {/* Floating Top Header: Profile & Theme */}
            <header className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20 dark:border-gray-800 shadow-2xl pointer-events-auto">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-xs shadow-sm">I</div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white pr-2">Tracker</span>
                </div>

                <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20 dark:border-gray-800 shadow-2xl pointer-events-auto">
                    <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-24 pb-36 animate-fade-in">
                {(authLoading || loading) && !isDemo ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Preparing tracker...</p>
                    </div>
                ) : (
                    <>
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
                                user={user}
                                onLogin={loginWithGoogle}
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
                                users={users}
                            />
                        )}
                        {currentView === 'account' && (
                            <AccountView
                                user={user}
                                role={role}
                                onLogin={loginWithGoogle}
                                onLogout={logout}
                                requestAdminAccess={requestAdminAccess}
                                isDark={isDark}
                            />
                        )}
                    </>
                )}
            </main>

            {/* macOS Floating Dock */}
            <nav className="nav-dock">
                {/* Active Bubble Indicator */}
                <div
                    className="nav-bubble"
                    style={{
                        width: `calc(100% / ${navItems.length} - 8px)`,
                        transform: `translateX(${currentView === 'resident'
                            ? '0'
                            : currentView === 'admin'
                                ? '100%'
                                : '200%'})`,
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
        </div>
    );
}
