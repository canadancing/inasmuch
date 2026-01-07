import { useState } from 'react';
import InventorySwitcher from './components/InventorySwitcher';
import { useFirestore } from './hooks/useFirestore';
import { useCustomIcons } from './hooks/useCustomIcons';
import { useTags } from './hooks/useTags';
import { usePendingRequestsCount } from './hooks/usePendingRequestsCount';
import { useInventory } from './context/InventoryContext';
import ThemeToggle from './components/ThemeToggle';
import ResidentView from './views/ResidentView';
import AdminView from './views/AdminView';
import AccountView from './views/AccountView';
import LogUsageModal from './components/LogUsageModal';

export default function App({ user, loading, loginWithGoogle, logout, isAdmin, isSuperAdmin, role, requestAdminAccess, isDark, toggleTheme }) {
    const [currentView, setCurrentView] = useState('stock');

    const {
        items,
        residents,
        logs,
        addItem,
        updateItem,
        deleteItem,
        addResident,
        updateResident,
        deleteResident,
        addLog,
        restockItem
    } = useFirestore(user);

    const {
        customIcons,
        addCustomIcon,
        updateCustomIcon,
        deleteCustomIcon,
        customIconsMap
    } = useCustomIcons(user);

    const {
        tags,
        tagColors,
        addTag,
        updateTag,
        removeTag,
        getTagStyles,
        tagsMap
    } = useTags();

    const pendingRequestsCount = usePendingRequestsCount(user);
    const { permissions: inventoryPermissions } = useInventory();

    const [showLogModal, setShowLogModal] = useState(false);

    const navItems = [
        { id: 'stock', label: 'STOCK', icon: '📦' },
        { id: 'log', label: 'LOG', icon: '✏️', isAction: true },
        { id: 'admin', label: 'ADMIN', icon: '⚙️' },
        { id: 'account', label: 'ACCOUNT', icon: '👤' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
            {/* Header with Branding and Theme Toggle - iOS Glass Effect */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                            I
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                INASMUCH
                            </h1>
                            <p className="text-xs text-primary-500 dark:text-primary-400 font-semibold tracking-wider uppercase">
                                Supply Tracker
                            </p>
                        </div>
                    </div>

                    {user && <InventorySwitcher />}

                    <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-24 pb-32 px-6 max-w-5xl mx-auto w-full overflow-y-auto">
                {!user ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-4xl shadow-2xl mb-6">
                            I
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                            Welcome to INASMUCH
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                            Track shared house supplies with ease. Sign in to get started.
                        </p>
                        <button
                            onClick={loginWithGoogle}
                            className="btn-primary px-8 py-4 text-lg"
                        >
                            Sign in with Google
                        </button>
                    </div>
                ) : currentView === 'stock' ? (
                    <ResidentView
                        items={items}
                        residents={residents}
                        onLog={(resId, resName, itemId, itemName, action, qty, date) => addLog(resId, resName, itemId, itemName, action, qty, date)}
                        customIcons={customIcons}
                        tags={tags}
                        getTagStyles={getTagStyles}
                        user={user}
                    />
                ) : currentView === 'admin' ? (
                    <AdminView
                        residents={residents}
                        items={items}
                        logs={logs}
                        auditLogs={auditLogs}
                        users={users} // Item props
                        onAddItem={addItem}
                        onUpdateItem={updateItem}
                        onDeleteItem={deleteItem}
                        onRestock={restockItem}
                        // Resident props
                        onAddResident={addResident}
                        onUpdateResident={updateResident}
                        onDeleteResident={deleteResident}
                        // Log actions
                        onDeleteLog={deleteLog}
                        onUpdateLog={updateLog}
                        // Icon props
                        customIcons={customIcons}
                        onAddIcon={addCustomIcon}
                        onUpdateIcon={updateCustomIcon}
                        onDeleteIcon={deleteCustomIcon}
                        customIconsMap={customIconsMap}
                        // Tag props
                        tags={tags}
                        tagsMap={tagsMap}
                        tagColors={tagColors}
                        onAddTag={addTag}
                        onUpdateTag={updateTag}
                        onRemoveTag={removeTag}
                        getTagStyles={getTagStyles}
                        // User/Auth props
                        user={user}
                        isAdmin={isAdmin}
                        isSuperAdmin={isSuperAdmin}
                        role={role}
                        permissions={inventoryPermissions}
                        onRequestAdminAccess={requestAdminAccess}
                    />
                ) : currentView === 'account' ? (
                    <AccountView
                        user={user}
                        onLogin={loginWithGoogle}
                        onLogout={logout}
                    />
                ) : null}
            </main>

            {/* Bottom Nav - iOS Dock Style */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
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
                                className="flex flex-col items-center justify-center px-8 py-2 rounded-2xl transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/30 relative"
                            >
                                {/* iOS Notification Badge - IMPROVED */}
                                {item.id === 'account' && pendingRequestsCount > 0 && (
                                    <div className="absolute -top-1 right-2 min-w-[24px] h-6 px-1.5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-[3px] border-white dark:border-gray-900 z-10 animate-pulse">
                                        <span className="text-white text-xs font-black leading-none">
                                            {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                                        </span>
                                    </div>
                                )}
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
                onLog={(resId, resName, itemId, itemName, action, qty, date) => addLog(resId, resName, itemId, itemName, action, qty, date)}
                user={user}
            />
        </div>
    );
}
