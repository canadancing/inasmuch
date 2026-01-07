// Helper component for upgrade request modal
import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import AccessRequestModal from '../components/AccessRequestModal';

export function UpgradeRequestPrompt({ isOpen, onClose, action, user }) {
    const { currentInventory } = useInventory();

    if (!isOpen || !currentInventory) return null;

    // Find the owner to send the upgrade request to
    const owner = {
        uid: currentInventory.ownerId,
        displayName: currentInventory.ownerName || 'Inventory Owner',
        photoURL: currentInventory.ownerPhoto || ''
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md shadow-2xl">
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">🔒</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Edit Access Required
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        You need edit access to {action}. Would you like to request an upgrade?
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <AccessRequestModal
                        isOpen={true}
                        onClose={onClose}
                        targetUser={owner}
                        currentUser={user}
                        currentInventoryId={currentInventory.id}
                        currentInventoryName={currentInventory.name}
                        onSuccess={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
