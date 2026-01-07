import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFirestore } from './hooks/useFirestore';
import { useCustomIcons } from './hooks/useCustomIcons';
import { useTags } from './hooks/useTags';
import ThemeToggle from './components/ThemeToggle';
import ResidentView from './views/ResidentView';
import AdminView from './views/AdminView';
import AccountView from './views/AccountView';
import LogUsageModal from './components/LogUsageModal';
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

    const [showLogModal, setShowLogModal] = useState(false);

    const navItems = [
        { id: 'resident', label: 'LOG', icon: '📝' },
        { id: 'add', label: '+', icon: '+', isAction: true },
        { id: 'admin', label: 'ADMIN', icon: '⚙️' },
        { id: 'account', label: 'ACCOUNT', icon: '👤' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
            {/* Header with Branding and Theme Toggle */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                            I
                        </div>
                        <div>
                            <h1 className="font-black text-2xl tracking-tight text-gray-900 dark:text-white leading-none uppercase">Inasmuch</h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400 font-bold">Supply Tracker</p>
                        </div>
                    </div>
                    <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 pt-28 pb-36 animate-fade-in">
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

            {/* iOS-Style Navigation Dock */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 bg-gray-900/90 dark:bg-gray-800/90 backdrop-blur-xl px-3 py-2.5 rounded-full border border-gray-700/50 shadow-2xl">
                    {navItems.map((item) => {
                        const isActive = currentView === item.id && !item.isAction;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (item.isAction) {
                                        if (!user) {
                                            loginWithGoogle();
                                        } else if (isAdmin) {
                                            setShowLogModal(true);
                                        }
                                    } else {
                                        setCurrentView(item.id);
                                    }
                                }}
                                className={`flex flex-col items-center justify-center px-5 py-2 rounded-full transition-all duration-200 ${isActive ? 'bg-primary-500/20' : 'hover:bg-gray-700/50'
                                    } ${item.isAction ? 'bg-gradient-to-br from-primary-500 to-accent-500 w-12 h-12 p-0 mx-1' : ''}`}
                            >
                                {item.isAction ? (
                                    <span className="text-3xl font-thin text-white">+</span>
                                ) : (
                                    <>
                                        <span className={`text-xl mb-0.5 transition-all ${isActive ? 'scale-110' : 'opacity-70'
                                            }`}>{item.icon}</span>
                                        <span className={`text-[8px] font-semibold uppercase tracking-wider transition-all ${isActive ? 'text-primary-400' : 'text-gray-400'
                                            }`}>{item.label}</span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Log Usage Modal */}
            <LogUsageModal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                residents={residents}
                items={items}
                onLog={(resId, resName, itemId, itemName, action, qty, date) => addLog(resId, resName, itemId, itemName, action, qty, date, user)}
                user={user}
            />
        </div>
    );
}
