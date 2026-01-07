// Component for switching between inventories
import { useInventory } from '../context/InventoryContext';

export default function InventorySwitcher() {
    const { inventories, currentInventoryId, switchInventory, permissions } = useInventory();

    if (!inventories || inventories.length === 0) {
        return null;
    }

    const currentInventory = inventories.find(inv => inv.id === currentInventoryId);
    const getRoleBadge = (inventory) => {
        if (inventory.ownerId === permissions?.isOwner) {
            return { icon: '👑', label: 'Owner', color: 'text-green-500' };
        }
        const perm = inventory.collaborators?.[permissions?.userId];
        if (perm?.permission === 'edit') {
            return { icon: '✏️', label: 'Editor', color: 'text-orange-500' };
        }
        return { icon: '👁️', label: 'Viewer', color: 'text-blue-500' };
    };

    if (inventories.length === 1) {
        const badge = getRoleBadge(inventories[0]);
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {inventories[0].name}
                </span>
                <span className={`text-xs ${badge.color}`}>
                    {badge.icon} {badge.label}
                </span>
            </div>
        );
    }

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {currentInventory?.name || 'Select Inventory'}
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
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2">
                    {inventories.map((inventory) => {
                        const badge = getRoleBadge(inventory);
                        return (
                            <button
                                key={inventory.id}
                                onClick={() => switchInventory(inventory.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentInventoryId === inventory.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                                    }`}
                            >
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {inventory.name}
                                </span>
                                <span className={`text-xs ${badge.color} flex items-center gap-1`}>
                                    <span>{badge.icon}</span>
                                    <span>{badge.label}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
