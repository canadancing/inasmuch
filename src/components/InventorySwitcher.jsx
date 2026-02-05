// Component for switching between inventories with nickname support
import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import InventoryNicknameModal from './InventoryNicknameModal';
import CreateInventoryModal from './CreateInventoryModal';

export default function InventorySwitcher() {
    const { inventories, currentInventoryId, switchInventory, currentInventory, permissions, user, createInventory } = useInventory();
    const [renameInventory, setRenameInventory] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    if (!inventories || inventories.length === 0) {
        return null;
    }

    const getRoleBadge = (inventory) => {
        // Check if the CURRENT user owns THIS specific inventory
        if (inventory.isOwner) {
            return { icon: '⭐', label: 'OWNER', color: 'text-yellow-500' };
        }

        // For collaborated inventories, check the user's role
        const userRole = inventory.collaborators?.[user?.uid];
        if (userRole?.permission === 'edit') {
            return { icon: '✏️', label: 'EDITOR', color: 'text-blue-500' };
        }

        // Default to viewer
        return { icon: '👁️', label: 'VIEWER', color: 'text-gray-500' };
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
                            {/* MY INVENTORIES Section */}
                            {inventories.some(inv => inv.isOwner) && (
                                <>
                                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            📦 My Inventories
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        {inventories.filter(inv => inv.isOwner).map((inventory) => {
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
                                </>
                            )}

                            {/* SHARED WITH ME Section */}
                            {inventories.some(inv => !inv.isOwner) && (
                                <>
                                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-700">
                                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            🤝 Shared With Me
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        {inventories.filter(inv => !inv.isOwner).map((inventory) => {
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
                                                            <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                                                                Owner: {inventory.ownerDisplayName || inventory.ownerName}
                                                            </div>
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
                                                        title="Set Private Remark"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Divider */}
                            <div className="border-t border-gray-200 dark:border-gray-700 mx-2" />

                            {/* Create New Inventory Button */}
                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        setShowCreateModal(true);
                                    }}
                                    className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors font-semibold"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Create New Inventory</span>
                                </button>
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

            <CreateInventoryModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={createInventory}
            />
        </>
    );
}
