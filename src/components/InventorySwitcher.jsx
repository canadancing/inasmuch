// Component for switching between inventories with nickname support
import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import InventoryNicknameModal from './InventoryNicknameModal';

export default function InventorySwitcher() {
    const { inventories, currentInventoryId, switchInventory, currentInventory, permissions, user } = useInventory();
    const [renameInventory, setRenameInventory] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    if (!inventories || inventories.length === 0) {
        return null;
    }

    const getRoleBadge = (inventory) => {
        // Check if user owns this inventory
        if (inventory.isOwner || permissions?.isOwner) {
            return { icon: '👑', label: 'Owner', color: 'text-green-500' };
        }
        // Check collaborator permission
        const perm = inventory.collaborators?.[permissions?.userId];
        if (perm?.permission === 'edit') {
            return { icon: '✏️', label: 'Editor', color: 'text-orange-500' };
        }
        return { icon: '👁️', label: 'Viewer', color: 'text-blue-500' };
    };

    if (inventories.length === 1) {
        const badge = getRoleBadge(inventories[0]);
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {inventories[0].displayName}
                    </span>
                    <span className={`text-xs ${badge.color}`}>
                        {badge.icon} {badge.label}
                    </span>
                </div>
                <button
                    onClick={() => setRenameInventory(inventories[0])}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                    title="Rename"
                >
                    <span className="text-sm">✏️</span>
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="relative flex items-center gap-2">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {currentInventory ? currentInventory.displayName : 'Select Inventory'}
                    </span>
                    {currentInventory && (
                        <span className={`text-xs ${getRoleBadge(currentInventory).color}`}>
                            {getRoleBadge(currentInventory).icon}
                        </span>
                    )}
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Quick Edit Button */}
                {currentInventory && (
                    <button
                        onClick={() => setRenameInventory(currentInventory)}
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors shadow-sm"
                        title="Edit inventory name"
                    >
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                )}

                {/* Dropdown */}
                {dropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-scale-in">
                            <div className="p-2">
                                {inventories.map((inventory) => {
                                    const badge = getRoleBadge(inventory);
                                    const hasCustomName = inventory.privateNickname || inventory.publicNickname;

                                    return (
                                        <div
                                            key={inventory.id}
                                            className={`flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentInventoryId === inventory.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    switchInventory(inventory.id);
                                                    setDropdownOpen(false);
                                                }}
                                                className="flex-1 flex items-center justify-between text-left min-w-0"
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        {inventory.displayName}
                                                    </div>
                                                    {hasCustomName && (
                                                        <div className="text-[10px] text-gray-400 font-medium truncate">
                                                            Original: {inventory.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] ${badge.color} flex items-center gap-1 font-black uppercase tracking-widest ml-2 flex-shrink-0`}>
                                                    <span>{badge.icon}</span>
                                                    <span>{badge.label}</span>
                                                </span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRenameInventory(inventory);
                                                }}
                                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-primary-500"
                                                title="Rename"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <InventoryNicknameModal
                isOpen={!!renameInventory}
                onClose={() => setRenameInventory(null)}
                target={renameInventory}
                type={renameInventory?.isOwner ? 'public' : 'private'}
                onSuccess={() => {
                    // Inventory list will auto-refresh via real-time listener
                }}
            />
        </>
    );
}
