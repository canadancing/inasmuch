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
import PeopleView from './views/PeopleView';
import RoomsView from './views/RoomsView';
import AccessRequestModal from './components/AccessRequestModal';
import ConsumptionModal from './components/ConsumptionModal';
import RestockModal from './components/RestockModal';
import SuperAdminView from './views/SuperAdminView';
import { isSuperAdmin as checkIsSuperAdmin } from './config/superAdmin';
// Import utility for fixing location roles (available in browser console as window.fixLocationRoles)
import './utils/fixLocationRoles';

export default function App({ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, linkGoogleAccount, linkEmailAccount, unlinkGoogleAccount, unlinkEmailAccount, logout, isAdmin, isSuperAdmin, role, requestAdminAccess, isDark, toggleTheme, rememberMe, toggleRememberMe, error }) {
    const [currentView, setCurrentView] = useState('stock');

    const {
        items,
        archivedItems,
        residents,
        archivedResidents,
        logs,
        auditLogs,
        addItem,
        updateItem,
        deleteItem,
        restoreItem,
        addResident,
        updateResident,
        deleteResident,
        restoreResident,
        addLog,
        updateLog,
        deleteLog,
        restockItem,
        updateUserRole,
        users,
        standards,
        addStandard,
        deleteStandard
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

    const [showConsumptionModal, setShowConsumptionModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedPersonForConsumption, setSelectedPersonForConsumption] = useState(null);
    const [selectedPersonForRestock, setSelectedPersonForRestock] = useState(null);
    const [selectedItemsForConsumption, setSelectedItemsForConsumption] = useState(null);
    const [selectedItemsForRestock, setSelectedItemsForRestock] = useState(null);

    // Helper to find the top 3 most interacted items for a person to pre-fill modals
    const getTopItemsForPerson = (personId, actionType) => {
        const personLogs = logs.filter(l => l.residentId === personId && l.action === actionType);
        if (personLogs.length === 0) return [];

        const counts = {};
        personLogs.forEach(l => {
            counts[l.itemId] = (counts[l.itemId] || 0) + 1;
        });

        const sortedItemIds = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) // highest first
            .slice(0, 3) // take top 3
            .map(e => e[0]);

        return items.filter(i => sortedItemIds.includes(i.id));
    };

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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0014.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                );
            case 'people':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                );
            case 'superadmin':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                );
            case 'rooms':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.592 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Build nav items - add super admin only for authorized users
    const baseNavItems = [
        { id: 'people', label: 'PEOPLE' },
        { id: 'rooms', label: 'ROOMS' },
        { id: 'stock', label: 'STORAGE' },
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
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                            I
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                INASMUCH
                            </h1>
                            <p className="text-xs text-primary-500 dark:text-primary-400 font-semibold tracking-wider uppercase">
                                Supply Tracker
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                        {user && <div className="min-w-0 flex-shrink"><InventorySwitcher /></div>}
                        <div className="flex-shrink-0"><ThemeToggle isDark={isDark} onToggle={toggleTheme} /></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-24 pb-32 px-6 max-w-5xl mx-auto w-full overflow-y-auto">
                {currentView === 'account' ? (
                    <AccountView
                        user={user}
                        onLogin={loginWithGoogle}
                        onLoginWithEmail={loginWithEmail}
                        onRegister={registerWithEmail}
                        onLinkGoogle={linkGoogleAccount}
                        onLinkEmail={linkEmailAccount}
                        onUnlinkGoogle={unlinkGoogleAccount}
                        onUnlinkEmail={unlinkEmailAccount}
                        onLogout={logout}
                        error={error}
                    />
                ) : !user ? (
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
                        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                            <button
                                onClick={() => setCurrentView('account')}
                                className="btn-primary px-8 py-4 text-lg"
                            >
                                Get Started
                            </button>
                            <button
                                onClick={loginWithGoogle}
                                className="px-8 py-3 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center gap-3 text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google Login
                            </button>
                        </div>
                    </div>
                ) : currentView === 'people' ? (
                    <PeopleView
                        residents={residents}
                        logs={logs}
                        onAddResident={addResident}
                        onUpdateResident={updateResident}
                        onDeleteResident={deleteResident}
                        tags={tags}
                        onOpenLogModal={(person) => {
                            setSelectedPersonForConsumption(person);
                            setSelectedItemsForConsumption(getTopItemsForPerson(person.id, 'used'));
                            setShowConsumptionModal(true);
                        }}
                        onOpenRestockModal={(person) => {
                            setSelectedPersonForRestock(person);
                            setSelectedItemsForRestock(getTopItemsForPerson(person.id, 'restocked'));
                            setShowRestockModal(true);
                        }}
                    />
                ) : currentView === 'rooms' ? (
                    <RoomsView
                        residents={residents}
                        items={items}
                        logs={logs}
                        onAddResident={addResident}
                        onUpdateResident={updateResident}
                        onDeleteResident={deleteResident}
                        tags={tags}
                        onUpdateItem={updateItem}
                        onLog={addLog}
                        standards={standards}
                        addStandard={addStandard}
                        deleteStandard={deleteStandard}
                        canEdit={!user || inventoryPermissions?.canEdit}
                    />
                ) : currentView === 'stock' ? (
                    <ResidentView
                        items={items}
                        logs={logs}
                        residents={residents}
                        loading={loading}
                        isDemo={!user}
                        isAdmin={isAdmin}
                        onRestock={restockItem}
                        onLog={(resId, resName, itemId, itemName, action, qty, date) => addLog(resId, resName, itemId, itemName, action, qty, date)}
                        onAddResident={addResident}
                        onAddItem={addItem}
                        onUpdateItem={updateItem}
                        onDeleteItem={deleteItem}
                        onUpdateLog={updateLog}
                        onDeleteLog={deleteLog}
                        setCurrentView={setCurrentView}
                        customIcons={customIcons}
                        tags={tags}
                        getTagStyles={getTagStyles}
                        user={user}
                    />
                ) : currentView === 'admin' ? (
                    <AdminView
                        residents={residents}
                        archivedResidents={archivedResidents}
                        items={items}
                        archivedItems={archivedItems}
                        logs={logs}
                        auditLogs={auditLogs}
                        users={users}
                        onAddItem={addItem}
                        onUpdateItem={updateItem}
                        onDeleteItem={deleteItem}
                        onRestoreItem={restoreItem}
                        onRestoreResident={restoreResident}
                        onRestock={(item) => {
                            setSelectedPersonForRestock(null);
                            setSelectedItemsForRestock([item]);
                            setShowRestockModal(true);
                        }}
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
                ) : currentView === 'superadmin' ? (
                    <SuperAdminView user={user} />
                ) : null}
            </main>

            {/* Global Modals for people view cross-features */}
            <ConsumptionModal
                isOpen={showConsumptionModal}
                onClose={() => {
                    setShowConsumptionModal(false);
                    setSelectedPersonForConsumption(null);
                    setSelectedItemsForConsumption(null);
                }}
                items={items}
                residents={residents}
                onLog={addLog}
                onAddResident={addResident}
                setCurrentView={setCurrentView}
                user={user}
                tags={tags}
                initialPerson={selectedPersonForConsumption}
                initialItems={selectedItemsForConsumption}
            />

            <RestockModal
                isOpen={showRestockModal}
                onClose={() => {
                    setShowRestockModal(false);
                    setSelectedPersonForRestock(null);
                    setSelectedItemsForRestock(null);
                }}
                items={items}
                residents={residents}
                onRestock={restockItem}
                setCurrentView={setCurrentView}
                user={user}
                tags={tags}
                initialPerson={selectedPersonForRestock}
                initialItems={selectedItemsForRestock}
            />

            {/* Bottom Nav - iOS Dock Style with Glassmorphism */}
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-1 px-3 py-2 bg-gray-800/60 backdrop-blur-2xl rounded-full shadow-2xl border border-gray-500/30">
                    {navItems.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id)}
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
            </nav >

            {/* Restock Modal */}
        </div >
    );
}
