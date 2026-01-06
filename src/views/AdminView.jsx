import { useState, useEffect } from 'react';
import HistoryLog from '../components/HistoryLog';
import AdminPanel from '../components/AdminPanel';
import ResidentSelector from '../components/ResidentSelector';
import Statistics from '../components/Statistics';

export default function AdminView({
    residents,
    items,
    logs,
    loading,
    isDemo,
    isDark,
    onAddResident,
    onUpdateResident,
    onRemoveResident,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    onRestock,
    // Log management props
    onDeleteLog,
    onUpdateLog,
    // Custom icon props
    customIcons = [],
    onAddCustomIcon,
    onUpdateCustomIcon,
    onRemoveCustomIcon,
    customIconsMap = {},
    // Tag props
    tags = [],
    tagsMap = {},
    tagColors = [],
    onAddTag,
    onUpdateTag,
    onRemoveTag,
    getTagStyles
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [activeTab, setActiveTab] = useState('history');

    // Default PIN - in production, this should be configurable
    const ADMIN_PIN = '1234';

    // Check for saved authentication
    useEffect(() => {
        const savedAuth = sessionStorage.getItem('adminAuth');
        if (savedAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) {
            setIsAuthenticated(true);
            sessionStorage.setItem('adminAuth', 'true');
            setPinError(false);
        } else {
            setPinError(true);
            setPin('');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminAuth');
        setPin('');
    };

    const tabs = [
        { id: 'stats', label: 'Stats', icon: '📊' },
        { id: 'history', label: 'History', icon: '📋' },
        { id: 'manage', label: 'Manage', icon: '⚙️' },
    ];

    // PIN Entry Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="card p-8 w-full max-w-sm text-center animate-fade-in">
                    <div className="text-6xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Admin Access
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Enter the PIN to access admin features
                    </p>

                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter PIN"
                                className={`input text-center text-2xl tracking-widest ${pinError ? 'border-red-500 focus:ring-red-500' : ''
                                    }`}
                                maxLength={6}
                                autoFocus
                            />
                            {pinError && (
                                <p className="text-red-500 text-sm mt-2">Incorrect PIN</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={pin.length < 4}
                        >
                            Unlock
                        </button>
                    </form>

                    <p className="text-xs text-gray-400 mt-6">
                        Default PIN: 1234
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Brand */}
            <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                        I
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                        Dashboard
                    </h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Lock
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'stats' && (
                <Statistics logs={logs} items={items} residents={residents} />
            )}

            {activeTab === 'history' && (
                <HistoryLog
                    logs={logs}
                    loading={loading}
                    onDeleteLog={onDeleteLog}
                    onUpdateLog={onUpdateLog}
                    residents={residents}
                    items={items}
                />
            )}

            {activeTab === 'manage' && (
                <AdminPanel
                    residents={residents}
                    items={items}
                    isDemo={isDemo}
                    isDark={isDark}
                    onAddResident={onAddResident}
                    onUpdateResident={onUpdateResident}
                    onRemoveResident={onRemoveResident}
                    onAddItem={onAddItem}
                    onUpdateItem={onUpdateItem}
                    onRemoveItem={onRemoveItem}
                    onRestock={onRestock}
                    customIcons={customIcons}
                    onAddCustomIcon={onAddCustomIcon}
                    onUpdateCustomIcon={onUpdateCustomIcon}
                    onRemoveCustomIcon={onRemoveCustomIcon}
                    customIconsMap={customIconsMap}
                    tags={tags}
                    tagsMap={tagsMap}
                    tagColors={tagColors}
                    onAddTag={onAddTag}
                    onUpdateTag={onUpdateTag}
                    onRemoveTag={onRemoveTag}
                    getTagStyles={getTagStyles}
                />
            )}
        </div>
    );
}
