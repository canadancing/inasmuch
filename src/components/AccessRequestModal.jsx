import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addDoc, collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import UserAvatar from './UserAvatar';

export default function AccessRequestModal({ isOpen, onClose, targetUser, currentUser, onSuccess, currentInventoryId, currentInventoryName }) {
    const [permission, setPermission] = useState('view');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleSubmit = async () => {
        if (!currentUser) return;
        if (!currentInventoryId && !targetUser) return;

        setIsSubmitting(true);
        try {
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

            // Activity log for requester
            const notificationsRef = collection(db, 'notifications');
            const activityNotifRef = doc(notificationsRef);
            batch.set(activityNotifRef, {
                targetUid: currentUser.uid,
                type: 'request_sent',
                message: `You sent a request to ${targetUser?.displayName || 'view inventory'}.`,
                read: true,
                createdAt: serverTimestamp()
            });

            await batch.commit();
            onSuccess?.();
            onClose();
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
    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-scale-in overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                        Request Access
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors text-gray-500"
                    >
                        ×
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Target User */}
                    <div className="flex items-center gap-3">
                        <UserAvatar user={targetUser} size="md" />
                        <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {targetUser.displayName || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Requesting access to their inventory
                            </div>
                        </div>
                    </div>

                    {/* Permissions - Side by Side */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">
                            Permission Level
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPermission('view')}
                                className={`p-3 rounded-xl border-2 text-left transition-all ${permission === 'view'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                    }`}
                            >
                                <div className="text-lg mb-1">👁️</div>
                                <div className="text-xs font-bold text-gray-900 dark:text-white">View Only</div>
                                <div className="text-[9px] text-gray-500 leading-tight mt-1">
                                    See items but cannot edit
                                </div>
                            </button>

                            <button
                                onClick={() => setPermission('edit')}
                                className={`p-3 rounded-xl border-2 text-left transition-all ${permission === 'edit'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                    }`}
                            >
                                <div className="text-lg mb-1">✏️</div>
                                <div className="text-xs font-bold text-gray-900 dark:text-white">Edit Access</div>
                                <div className="text-[9px] text-gray-500 leading-tight mt-1">
                                    Add, edit, and log usage
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">
                            Message (Optional)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Hi! I'd like to collaborate..."
                            rows={3}
                            maxLength={140}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:border-primary-500 focus:ring-0 transition-colors resize-none placeholder:text-gray-400 text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span>Send Request</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
