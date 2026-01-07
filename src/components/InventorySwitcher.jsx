// Component for switching between inventories with nickname support
import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import InventoryNicknameModal from './InventoryNicknameModal';

export default function InventorySwitcher() {
    const { inventories, currentInventoryId, switchInventory, currentInventory, permissions } = useInventory();
    const [renameInventory, setRenameInventory] = useState(null);

    if (!inventories || inventories.length === 0) {
        return null;
    }

    const getDisplayName = (inventory) => {
        return inventory.nickname || inventory.name;
    };

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
                        {getDisplayName(inventories[0])}
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
            <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {currentInventory ? getDisplayName(currentInventory) : 'Select Inventory'}
                    </span>
                    {currentInventory && (
                        <span className={`text-xs ${getRoleBadge(currentInventory).color}`}>
                            {getRoleBadge(currentInventory).icon}
                        </span>
                    )}
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown */}
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-2">
                        {inventories.map((inventory) => {
                            const badge = getRoleBadge(inventory);
                            return (
                                <div
                                    key={inventory.id}
                                    className={`flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentInventoryId === inventory.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                                        }`}
                                >
                                    <button
                                        onClick={() => switchInventory(inventory.id)}
                                        className="flex-1 flex items-center justify-between text-left"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {getDisplayName(inventory)}
                                            </div>
                                            {inventory.nickname && (
                                                <div className="text-xs text-gray-500">
                                                    {inventory.name}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-xs ${badge.color} flex items-center gap-1`}>
                                            <span>{badge.icon}</span>
                                            <span>{badge.label}</span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRenameInventory(inventory);
                                        }}
                                        className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                        title="Rename"
                                    >
                                        <span className="text-sm">✏️</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <InventoryNicknameModal
                isOpen={!!renameInventory}
                onClose={() => setRenameInventory(null)}
                inventory={renameInventory ? { ...renameInventory, userId: permissions?.userId } : null}
                onSuccess={() => {
                    // Inventory list will auto-refresh via real-time listener
                }}
            />
        </>
    );
}
