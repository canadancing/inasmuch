// Modal for requesting access to another user's inventory
import { useState } from 'react';
import { addDoc, collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AccessRequestModal({ isOpen, onClose, targetUser, currentUser, onSuccess, currentInventoryId, currentInventoryName }) {
    const [permission, setPermission] = useState('view');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!currentUser) return;
        // If not an upgrade, we need a targetUser
        if (!currentInventoryId && !targetUser) return;

        setIsSubmitting(true);
        try {
            // Create access request and log activity
            const batch = writeBatch(db);
            const requestsRef = collection(db, 'accessRequests');
            const newRequestRef = doc(requestsRef);

            batch.set(newRequestRef, {
                requesterId: currentUser.uid,
                requesterName: currentUser.displayName,
                requesterPhoto: currentUser.photoURL,
                requesterEmail: currentUser.email,
                targetUserId: targetUser?.uid || '',
                targetUserName: targetUser?.displayName || '',
                inventoryId: currentInventoryId || '',
                inventoryName: currentInventoryName || '',
                permission,
                message: message.trim(),
                status: 'pending',
                createdAt: serverTimestamp(),
                isUpgrade: !!currentInventoryId
            });

            // Add notification for the requester (activity log)
            const notificationsRef = collection(db, 'notifications');
            const activityNotifRef = doc(notificationsRef);
            batch.set(activityNotifRef, {
                targetUid: currentUser.uid,
                type: 'request_sent',
                message: `You sent a request to ${targetUser?.displayName || 'view inventory'}.`,
                read: true, // Activity log starts as read
                createdAt: serverTimestamp()
            });

            await batch.commit();

            // Success!
            onSuccess?.();
            onClose();

            // Reset form
            setPermission('view');
            setMessage('');
        } catch (error) {
            console.error('Error sending access request:', error);
            alert('Failed to send request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;
    if (!currentInventoryId && !targetUser) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Request Access
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                        >
                            <span className="text-2xl text-gray-500">×</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Target user info */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <img
                            src={targetUser.photoURL}
                            alt={targetUser.displayName}
                            className="w-12 h-12 rounded-xl"
                        />
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                                {targetUser.displayName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Requesting access to their inventory
                            </div>
                        </div>
                    </div>

                    {/* Permission level */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                            Permission Level
                        </label>
                        <div className="space-y-2">
                            <button
                                onClick={() => setPermission('view')}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${permission === 'view'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>👁️</span>
                                            <span>View Only</span>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            See items and logs but cannot edit
                                        </div>
                                    </div>
                                    {permission === 'view' && (
                                        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </button>

                            <button
                                onClick={() => setPermission('edit')}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${permission === 'edit'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>✏️</span>
                                            <span>Edit Access</span>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Add, edit, and log usage
                                        </div>
                                    </div>
                                    {permission === 'edit' && (
                                        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Optional message */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Message (Optional)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Hi! I'd like to help manage the inventory..."
                            rows={3}
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-0 transition-colors resize-none"
                        />
                        <div className="text-xs text-gray-400 mt-1 text-right">
                            {message.length}/200
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/20"
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                            'Send Request'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
