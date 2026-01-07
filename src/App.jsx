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
import InventorySwitcher from './components/InventorySwitcher';

export default function App({ user, loading: authLoading, loginWithGoogle, logout, isAdmin }) {
    const [currentView, setCurrentView] = useState('stock');
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
        { id: 'stock', label: 'STOCK', icon: '📦' },
        { id: 'log', label: 'LOG', icon: '✏️', isAction: true },
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
                    <div className="flex items-center gap-3">
                        {user && <InventorySwitcher />}
                        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                    </div>
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
                        {currentView === 'stock' && (
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

            {/* iOS App Store-Style Navigation Dock */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl px-4 py-3 rounded-[28px] border border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
                    {navItems.map((item) => {
                        const isActive = currentView === item.id;
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
                                className="flex flex-col items-center justify-center px-8 py-2 rounded-2xl transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/30"
                            >
                                <span className={`text-2xl mb-1 transition-all ${isActive ? 'scale-110' : 'opacity-60'
                                    }`}>{item.icon}</span>
                                <span className={`text-[10px] font-semibold tracking-tight transition-all ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                                    }`}>{item.label}</span>
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
