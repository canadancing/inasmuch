import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFirestore } from './hooks/useFirestore';
import { useCustomIcons } from './hooks/useCustomIcons';
import { useTags } from './hooks/useTags';
import ThemeToggle from './components/ThemeToggle';
import ResidentView from './views/ResidentView';
import AdminView from './views/AdminView';

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
        restockItem
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
                {currentView === 'resident' && (
                    <ResidentView
                        residents={residents}
                        items={items}
                        onLog={addLog}
                        loading={loading}
                        isDemo={isDemo}
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
                        onRestock={restockItem}
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
                    />
                )}
            </main>

            {/* macOS Floating Dock */}
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
        </div>
    );
}
