import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function StandardsModal({ isOpen, onClose, standards = [], items = [], onAdd, onDelete }) {
    const [selectedItemId, setSelectedItemId] = useState('');
    const [bedSize, setBedSize] = useState('Twin');
    const [requiredQty, setRequiredQty] = useState(1);

    if (!isOpen) return null;

    // Filter to only show reusable items as standard options
    const reusableItems = items.filter(i => i.isReusable);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!selectedItemId) return;

        const item = items.find(i => i.id === selectedItemId);
        if (item) {
            onAdd({
                itemId: item.id,
                itemName: item.name,
                icon: item.icon,
                bedSize,
                requiredQty: parseInt(requiredQty, 10)
            });
            setSelectedItemId('');
            setRequiredQty(1);
        }
    };

    // Group existing standards by Bed Size
    const groupedStandards = standards.reduce((acc, std) => {
        if (!acc[std.bedSize]) acc[std.bedSize] = [];
        acc[std.bedSize].push(std);
        return acc;
    }, {});

    const bedSizes = ['Twin', 'Double', 'Queen', 'King', 'All'];

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <span>📋</span> Bedding Standards Configuration
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Define the required items for each bed size.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Add New Rule Form */}
                    <div className="bg-primary-50 dark:bg-primary-900/10 p-5 rounded-2xl border border-primary-100 dark:border-primary-900">
                        <h3 className="text-sm font-bold text-primary-700 dark:text-primary-400 mb-4 uppercase tracking-wider">Add New Requirement</h3>
                        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Bed Size</label>
                                <select
                                    value={bedSize}
                                    onChange={e => setBedSize(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary-500 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    {bedSizes.map(size => (
                                        <option key={size} value={size}>{size === 'All' ? 'All Bed Sizes' : `${size} Bed`}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-[2] w-full">
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Item Required</label>
                                <select
                                    value={selectedItemId}
                                    onChange={e => setSelectedItemId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary-500 text-sm font-medium text-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="" disabled>Select an item from Storage...</option>
                                    {reusableItems.map(item => (
                                        <option key={item.id} value={item.id}>{item.icon} {item.name}</option>
                                    ))}
                                </select>
                                {reusableItems.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">No reusable items found in storage. Add them first!</p>
                                )}
                            </div>
                            <div className="w-full sm:w-24">
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={requiredQty}
                                    onChange={e => setRequiredQty(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary-500 text-sm font-medium text-gray-900 dark:text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!selectedItemId}
                                className="w-full sm:w-auto px-4 py-2 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm"
                            >
                                Add Rule
                            </button>
                        </form>
                    </div>

                    {/* Current Rules List */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Current Rules</h3>
                        {standards.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No standards defined yet.</p>
                                <p className="text-xs text-gray-400 mt-1">Add items above to set the required bedding for each room.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {bedSizes.map(size => {
                                    const rulesForSize = groupedStandards[size] || [];
                                    if (rulesForSize.length === 0) return null;

                                    return (
                                        <div key={size} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                                <h4 className="font-bold text-gray-900 dark:text-white capitalize tracking-wide">
                                                    {size === 'All' ? 'Rules For All Beds' : `${size} Beds`}
                                                </h4>
                                            </div>
                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {rulesForSize.map(rule => (
                                                    <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-2xl bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm">{rule.icon || '📦'}</div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white">{rule.itemName}</div>
                                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                                    Target Quantity: <span className="text-primary-600 dark:text-primary-400 font-bold">{rule.requiredQty}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => onDelete(rule.id)}
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
}
