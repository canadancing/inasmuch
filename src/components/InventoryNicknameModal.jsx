// Component for renaming/adding nicknames to collaborated inventories
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function InventoryNicknameModal({ isOpen, onClose, inventory, onSuccess }) {
    const [nickname, setNickname] = useState(inventory?.nickname || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!inventory) return;

        setSaving(true);
        try {
            const inventoryRef = doc(db, 'inventories', inventory.id);
            await updateDoc(inventoryRef, {
                nickname: nickname.trim() || null,
                updatedAt: new Date()
            });

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error saving nickname:', error);
            alert('Failed to save nickname');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !inventory) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Rename Inventory
                    </h2>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder={inventory.name}
                            maxLength={50}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-0"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Original: {inventory.name}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
