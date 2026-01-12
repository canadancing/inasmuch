import { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';

export default function InventoryNicknameModal({ isOpen, onClose, target, type = 'public', onSuccess }) {
    const { updateInventoryPublicName, updateCollaboratorPrivateName } = useInventory();
    const [nickname, setNickname] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (target) {
            setNickname(target.privateNickname || target.publicNickname || target.name || target.displayName || '');
        }
    }, [target]);

    const handleSave = async () => {
        if (!target || !target.id) return;

        setSaving(true);
        try {
            if (type === 'public') {
                await updateInventoryPublicName(target.id, nickname.trim());
            } else {
                // type === 'private'
                await updateCollaboratorPrivateName(target.id, nickname.trim());
            }

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error saving nickname:', error);
            alert('Failed to save nickname');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !target) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        {type === 'public' ? (
                            <><span className="text-primary-500">🌍</span> Rename Inventory</>
                        ) : (
                            <><span className="text-accent-500">🔒</span> Set Private Remark</>
                        )}
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                        {type === 'public' ? 'Public Display Name' : 'Personal Reference'}
                    </p>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                            {type === 'public' ? 'New Name' : 'Remark Name'}
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder={target?.displayName || target?.name}
                            maxLength={50}
                            className="w-full px-5 py-4 rounded-[1.25rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white font-black text-lg focus:border-primary-500 focus:ring-0 transition-all outline-none"
                            autoFocus
                        />
                        <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                {type === 'public'
                                    ? 'This name will be visible to all collaborators invited to this inventory.'
                                    : `This name is private to you. Only you will see "${nickname || '...'}" instead of "${target?.displayName || target?.name}".`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 flex gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3.5 rounded-xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-lg shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Name'}
                    </button>
                </div>
            </div>
        </div>
    );
}
