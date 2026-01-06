import { useState } from 'react';
import ResidentSelector from '../components/ResidentSelector';
import ItemGrid from '../components/ItemGrid';
import QuantityStepper from '../components/QuantityStepper';

export default function ResidentView({ residents, items, onLog, loading, isDemo, isAdmin, role, requestAdminAccess }) {
    const [selectedResident, setSelectedResident] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const handleRequestAdmin = async () => {
        setIsSubmitting(true);
        try {
            await requestAdminAccess();
            setRequestSent(true);
        } catch (error) {
            console.error('Error requesting admin:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedResident || !selectedItem || !isAdmin) return;

        // Prevent if out of stock
        if (selectedItem.currentStock < quantity) return;

        setIsSubmitting(true);
        try {
            const [year, month, day] = logDate.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

            // If it's today, we can use the current time for better sorting
            const todayStr = new Date().toISOString().split('T')[0];
            if (logDate === todayStr) {
                const now = new Date();
                dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                // For past dates, set to noon to be safe
                dateObj.setHours(12, 0, 0, 0);
            }

            await onLog(
                selectedResident.id,
                `${selectedResident.firstName || ''} ${selectedResident.lastName || ''}`.trim() || selectedResident.name || 'Unknown',
                selectedItem.id,
                selectedItem.name,
                'used',
                quantity,
                dateObj
            );

            // Show success feedback
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

            // Reset selection
            setSelectedItem(null);
            setQuantity(1);
            setLogDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error('Error logging:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isOutOfStock = selectedItem && selectedItem.currentStock < quantity;
    const canSubmit = selectedResident && selectedItem && !isSubmitting && !isOutOfStock && isAdmin;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header / Brand */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                        I
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tight text-gray-900 dark:text-white leading-none uppercase">Inasmuch</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400 font-bold mt-1">Supply Tracker</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isAdmin && (
                        <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Read Only</span>
                        </div>
                    )}
                    {isDemo && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Demo</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Read-Only Banner / Request Access */}
            {!isAdmin && (
                <div className="mb-6 card p-4 bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🛡️</span>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Admin Privileges Required</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">You can view stock, but need approval to log usage.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRequestAdmin}
                            disabled={requestSent || isSubmitting}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${requestSent
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 active:scale-95'
                                }`}
                        >
                            {requestSent ? 'Request Sent' : 'Request Access'}
                        </button>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg animate-fade-in flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Logged successfully!</span>
                </div>
            )}

            {/* Resident Selector */}
            <div className="mb-6">
                <ResidentSelector
                    residents={residents}
                    selectedResident={selectedResident}
                    onSelect={setSelectedResident}
                />
            </div>

            {/* Item Grid */}
            <div className="flex-1 overflow-y-auto mb-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Current Stock
                </h2>
                <ItemGrid
                    items={items}
                    selectedItem={selectedItem}
                    onSelectItem={setSelectedItem}
                />
            </div>

            {/* Bottom Action Bar */}
            {selectedItem && (
                <div className="sticky bottom-0 bg-gradient-to-t from-gray-50 dark:from-gray-950 pt-4 pb-safe animate-slide-up">
                    <div className="card p-4 shadow-2xl border-primary-100 dark:border-primary-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{selectedItem.icon}</span>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedItem.name}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-500">How many?</p>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedItem.currentStock === 0
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                            }`}>
                                            {selectedItem.currentStock} in stock
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {isAdmin && (
                                <QuantityStepper
                                    quantity={quantity}
                                    onChange={setQuantity}
                                />
                            )}
                        </div>

                        {isAdmin ? (
                            <>
                                {/* Date Selection */}
                                <div className="mb-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Date</span>
                                    <input
                                        type="date"
                                        value={logDate}
                                        onChange={(e) => setLogDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                    />
                                </div>

                                <button
                                    onClick={handleConfirm}
                                    disabled={!canSubmit}
                                    className={`btn w-full text-lg ${canSubmit
                                        ? 'btn-primary shadow-lg shadow-primary-500/20'
                                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                    ) : !selectedResident ? (
                                        'Select a Resident First'
                                    ) : isOutOfStock ? (
                                        'Out of Stock'
                                    ) : (
                                        <>
                                            <span>Confirm</span>
                                            <span className="ml-2 opacity-70">
                                                {quantity}× {selectedItem.name}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-center text-xs text-gray-400 font-medium italic">
                                    Sign in as Admin to log usage
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
