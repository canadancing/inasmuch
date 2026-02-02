import { useState } from 'react';

export default function MoveOutModal({ isOpen, onClose, entity, onMoveOut }) {
    const [moveOutDate, setMoveOutDate] = useState(
        new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    );
    const [notes, setNotes] = useState('');

    if (!isOpen || !entity) return null;

    const handleSubmit = async () => {
        await onMoveOut(entity.id, {
            status: 'moved_out',
            moveOutDate: new Date(moveOutDate),
            notes
        });
        handleClose();
    };

    const handleClose = () => {
        setMoveOutDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        onClose();
    };

    const entityName = entity.displayName || entity.name || `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || 'Entity';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                            Move Out Resident
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Entity Info */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-gray-900 dark:text-white font-semibold">
                            {entityName} is moving out
                        </p>
                    </div>

                    {/* Move-out Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            📅 Move-out Date *
                        </label>
                        <input
                            type="date"
                            value={moveOutDate}
                            onChange={(e) => setMoveOutDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]} // Can't be in the future
                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            📝 Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                            rows={3}
                            placeholder="Completed lease, moved to new location, etc."
                        />
                    </div>

                    {/* Warning */}
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">
                            ⚠️ This will:
                        </p>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
                            <li>Remove from active lists</li>
                            <li>Hide from consumption dropdowns</li>
                            <li>Keep all historical data intact</li>
                            <li>Can be reactivated later if needed</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
                        >
                            Move Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
