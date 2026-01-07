import { useState, useEffect } from 'react';
import { db } from './firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import InventorySwitcher from './components/InventorySwitcher';
import { useFirestore } from './hooks/useFirestore';
import { useCustomIcons } from './hooks/useCustomIcons';
import { useTags } from './hooks/useTags';
import { usePendingRequestsCount } from './hooks/usePendingRequestsCount';
import { useUnreadNotificationsCount } from './hooks/useUnreadNotificationsCount';
import { useInventory } from './context/InventoryContext';
import ThemeToggle from './components/ThemeToggle';
import ResidentView from './views/ResidentView';
import AdminView from './views/AdminView';
import AccountView from './views/AccountView';
import LogUsageModal from './components/LogUsageModal';
import RestockModal from './components/RestockModal';
import AccessRequestModal from './components/AccessRequestModal';
import SuperAdminView from './views/SuperAdminView';
import { isSuperAdmin as checkIsSuperAdmin } from './config/superAdmin';

export default function App({ user, loading, loginWithGoogle, logout, isAdmin, isSuperAdmin, role, requestAdminAccess, isDark, toggleTheme }) {
    const [currentView, setCurrentView] = useState('stock');

    const {
        items,
        residents,
        logs,
        auditLogs,
        addItem,
        updateItem,
        deleteItem,
        addResident,
        updateResident,
        deleteResident,
        addLog,
        updateLog,
        deleteLog,
        restockItem,
        updateUserRole,
        users
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
    const unreadNotificationsCount = useUnreadNotificationsCount(user);
    const totalAccountNotifications = (pendingRequestsCount || 0) + (unreadNotificationsCount || 0);
    const { permissions: inventoryPermissions } = useInventory();

    const [showLogModal, setShowLogModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeContext, setUpgradeContext] = useState(null);

    // iOS-style SVG icons for nav dock
    const NavIcon = ({ type, isActive }) => {
        const iconClass = `w-6 h-6 ${isActive ? 'text-white' : 'text-white/60'}`;
        switch (type) {
            case 'stock':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                );
            case 'log':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                );
            case 'restock':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                );
            case 'admin':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                );
            case 'account':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                );
            case 'superadmin':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Build nav items - add super admin only for authorized users
    const baseNavItems = [
        { id: 'stock', label: 'STOCK' },
        { id: 'log', label: 'LOG', isAction: true },
        { id: 'restock', label: 'RESTOCK', isAction: true },
        { id: 'admin', label: 'ADMIN' },
        { id: 'account', label: 'ACCOUNT' },
    ];

    const navItems = checkIsSuperAdmin(user)
        ? [...baseNavItems, { id: 'superadmin', label: 'SUPER' }]
        : baseNavItems;

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
                        setCurrentView={setCurrentView}
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
                        users={users}
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
                        // Admin actions
                        onUpdateUserRole={updateUserRole}
                        onRequestAdminAccess={requestAdminAccess}
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
                    />
                ) : currentView === 'account' ? (
                    <AccountView
                        user={user}
                        onLogin={loginWithGoogle}
                        onLogout={logout}
                    />
                ) : currentView === 'superadmin' ? (
                    <SuperAdminView user={user} />
                ) : null}
            </main>

            {/* Bottom Nav - iOS Dock Style with Glassmorphism */}
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-1 px-3 py-2 bg-gray-800/60 backdrop-blur-2xl rounded-full shadow-2xl border border-gray-500/30">
                    {navItems.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (item.isAction) {
                                        // LOG or RESTOCK action
                                        if (!user) {
                                            loginWithGoogle();
                                        } else if (item.id === 'log') {
                                            if (inventoryPermissions?.canEdit) {
                                                setShowLogModal(true);
                                            } else if (inventoryPermissions?.canView) {
                                                setUpgradeContext({ action: 'LOG' });
                                                setShowUpgradeModal(true);
                                            }
                                        } else if (item.id === 'restock') {
                                            if (inventoryPermissions?.canEdit) {
                                                setShowRestockModal(true);
                                            } else if (inventoryPermissions?.canView) {
                                                setUpgradeContext({ action: 'RESTOCK' });
                                                setShowUpgradeModal(true);
                                            }
                                        }
                                    } else {
                                        setCurrentView(item.id);
                                    }
                                }}
                                className="flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 hover:bg-white/20 relative"
                            >
                                {/* Unified Notification Badge */}
                                {item.id === 'account' && totalAccountNotifications > 0 && (
                                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 z-10">
                                        <span className="text-white text-[9px] font-black leading-none">
                                            {totalAccountNotifications > 9 ? '9+' : totalAccountNotifications}
                                        </span>
                                    </div>
                                )}
                                <NavIcon type={item.id} isActive={isActive} />
                                <span className={`text-[9px] font-bold tracking-tight transition-all mt-0.5 ${isActive ? 'text-white opacity-100' : 'text-white/60'
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
                setCurrentView={setCurrentView}
                user={user}
            />

            {/* Restock Modal */}
            <RestockModal
                isOpen={showRestockModal}
                onClose={() => setShowRestockModal(false)}
                items={items}
                onRestock={restockItem}
                setCurrentView={setCurrentView}
                user={user}
            />
        </div>
    );
}
