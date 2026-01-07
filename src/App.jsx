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
        { id: 'resident', label: 'Log', icon: '📝' },
        { id: 'add', label: 'Add', icon: '+', isAction: true },
        { id: 'admin', label: 'Admin', icon: '⚙️' },
        { id: 'account', label: 'Account', icon: '👤' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-500">


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
                        className={`relative z-10 flex flex-col items-center justify-center gap-1.5 px-6 py-2 rounded-3xl min-w-[90px] transition-all duration-300 group ${item.isAction ? 'bg-gradient-to-br from-primary-500 to-accent-500' : ''
                            }`}
                    >
                        <span className={`transition-all duration-500 ${item.isAction
                            ? 'text-4xl font-bold text-white scale-110 group-hover:scale-125'
                            : `text-2xl ${currentView === item.id
                                ? 'scale-110 -translate-y-1 drop-shadow-lg'
                                : 'group-hover:scale-110 group-hover:-translate-y-0.5 opacity-60'
                            }`
                            }`}>
                            {item.icon}
                        </span>
                        {!item.isAction && (
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${currentView === item.id
                                ? 'text-primary-600 dark:text-primary-300 opacity-100'
                                : 'text-gray-400 dark:text-gray-500 opacity-60 group-hover:opacity-100'
                                }`}>
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Theme Toggle - Bottom Right */}
            <div className="fixed bottom-32 right-8 z-40">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-2 rounded-2xl border border-white/20 dark:border-gray-800 shadow-2xl">
                    <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                </div>
            </div>

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
