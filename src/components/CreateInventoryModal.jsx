import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function CreateInventoryModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            alert('Please enter an inventory name');
            return;
        }

        setCreating(true);
        try {
            await onCreate({ name: name.trim(), description: description.trim() });
            // Reset form
            setName('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Error creating inventory:', error);
            alert(error.message || 'Failed to create inventory. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl animate-scale-in overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-primary-500">✨</span> Create New Inventory
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                        Set up a new independent inventory
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleCreate} className="p-6">
                    <div className="space-y-4">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Inventory Name
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Home, Office, Vacation House"
                                maxLength={50}
                                className="w-full px-5 py-4 rounded-[1.25rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white font-black text-lg focus:border-primary-500 focus:ring-0 transition-all outline-none"
                                autoFocus
                                disabled={creating}
                            />
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this inventory for?"
                                maxLength={200}
                                rows={3}
                                className="w-full px-5 py-4 rounded-[1.25rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium text-sm focus:border-primary-500 focus:ring-0 transition-all outline-none resize-none"
                                disabled={creating}
                            />
                        </div>

                        {/* Info Box */}
                        <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed break-words">
                                💡 Each inventory is completely independent with its own items, people, and logs.
                                You can switch between inventories anytime from the dropdown.
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={creating}
                            className="flex-1 px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating || !name.trim()}
                            className="flex-1 px-6 py-3 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Inventory
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
