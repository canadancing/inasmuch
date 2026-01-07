import { useState } from 'react';
import { doc, updateDoc, deleteField, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useInventory } from '../context/InventoryContext';

export default function CollaboratorManagement({ user }) {
    const { currentInventory, permissions } = useInventory();
    const [isUpdating, setIsUpdating] = useState(null);

    if (!currentInventory || !permissions?.isOwner) {
        return null;
    }

    const collaborators = currentInventory.collaborators || {};
    const collaboratorsList = Object.entries(collaborators).map(([uid, data]) => ({
        uid,
        ...data
    }));

    if (collaboratorsList.length === 0) {
        return null;
    }

    const handleUpdatePermission = async (collaboratorUid, newPermission) => {
        setIsUpdating(collaboratorUid);
        try {
            const inventoryRef = doc(db, 'inventories', currentInventory.id);
            await updateDoc(inventoryRef, {
                [`collaborators.${collaboratorUid}.permission`]: newPermission
            });

            // Send notification
            await addDoc(collection(db, 'notifications'), {
                targetUid: collaboratorUid,
                type: 'permission_change',
                newPermission,
                inventoryName: currentInventory.name,
                inventoryId: currentInventory.id,
                message: `Your access to "${currentInventory.name}" has been changed to ${newPermission}.`,
                read: false,
                createdAt: serverTimestamp()
            });

            alert(`✅ Updated to ${newPermission} access`);
        } catch (error) {
            console.error('Error updating permission:', error);
            alert('Failed to update permission');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleRevoke = async (collaboratorUid) => {
        if (!confirm('Are you sure you want to revoke access? This cannot be undone.')) {
            return;
        }

        setIsUpdating(collaboratorUid);
        try {
            const inventoryRef = doc(db, 'inventories', currentInventory.id);
            await updateDoc(inventoryRef, {
                [`collaborators.${collaboratorUid}`]: deleteField()
            });

            // Send notification
            await addDoc(collection(db, 'notifications'), {
                targetUid: collaboratorUid,
                type: 'access_revoked',
                inventoryName: currentInventory.name,
                message: `Your access to "${currentInventory.name}" has been revoked.`,
                read: false,
                createdAt: serverTimestamp()
            });

            alert('✅ Access revoked');
        } catch (error) {
            console.error('Error revoking access:', error);
            alert('Failed to revoke access');
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Collaborators ({collaboratorsList.length})
            </h3>

            <div className="space-y-3">
                {collaboratorsList.map((collaborator) => (
                    <div
                        key={collaborator.uid}
                        className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    Collaborator
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Added {new Date(collaborator.grantedAt?.seconds * 1000).toLocaleDateString()}
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${collaborator.permission === 'edit'
                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                }`}>
                                {collaborator.permission === 'edit' ? '✏️ Editor' : '👁️ Viewer'}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            {collaborator.permission === 'view' ? (
                                <button
                                    onClick={() => handleUpdatePermission(collaborator.uid, 'edit')}
                                    disabled={isUpdating === collaborator.uid}
                                    className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                                >
                                    {isUpdating === collaborator.uid ? 'Updating...' : 'Upgrade to Editor'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpdatePermission(collaborator.uid, 'view')}
                                    disabled={isUpdating === collaborator.uid}
                                    className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                    {isUpdating === collaborator.uid ? 'Updating...' : 'Downgrade to Viewer'}
                                </button>
                            )}
                            <button
                                onClick={() => handleRevoke(collaborator.uid)}
                                disabled={isUpdating === collaborator.uid}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                Revoke
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
