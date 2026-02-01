import { useState } from 'react';

export default function AddItemModal({ isOpen, onClose, onAddItem }) {
    const [itemName, setItemName] = useState('');
    const [itemIcon, setItemIcon] = useState('📦');

    const commonEmojis = [
        '🧻', '🧼', '🧽', '🧴', '🧺', '🔌', '💡', '🔋', '🛁', '🚿',
        '🧹', '🧯', '📦', '🎁', '🍽️', '🥄', '🔪', '🥤', '🍺', '☕',
        '🧃', '🧂', '🧈', '🥛', '🍞', '🧇', '🥐', '🧀', '🥚', '🍳'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (itemName.trim()) {
            onAddItem(itemName.trim(), itemIcon);
            setItemName('');
            setItemIcon('📦');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                            Add New Item
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Item Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Item Name
                        </label>
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="Enter item name..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-0 transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Icon Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Select Icon
                        </label>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="text-6xl">{itemIcon}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Click an emoji below to change
                            </div>
                        </div>
                        <div className="grid grid-cols-10 gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl max-h-48 overflow-y-auto">
                            {commonEmojis.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setItemIcon(emoji)}
                                    className={`text-2xl p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors ${itemIcon === emoji ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : ''
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!itemName.trim()}
                            className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Add Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
