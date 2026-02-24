import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function RoomDetailModal({ isOpen, onClose, room, items = [], logs = [], onUpdate, onDelete, onLog, canEdit = true }) {
    const [isEditingBedSize, setIsEditingBedSize] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    // Reset edit state when modal closes or room changes
    useMemo(() => {
        setIsEditingBedSize(false);
        setIsAssigning(false);
    }, [isOpen, room?.id]);

    // Use name or construct it (safe to do even if room is null because we will return null later if so)
    const roomId = room?.id || '';
    const roomBedSize = room?.bedSize || '';
    const fullName = room?.displayName || room?.name || `${room?.firstName || ''} ${room?.lastName || ''}`.trim() || 'Unknown Room';

    // Get all logs for this room
    const roomLogs = useMemo(() => {
        if (!isOpen || !room) return [];
        return logs.filter(log =>
            log.residentName === fullName || log.residentId === roomId
        );
    }, [logs, fullName, roomId, isOpen, room]);

    // Calculate currently held reusable items
    const heldItems = useMemo(() => {
        const held = {};
        roomLogs.forEach(log => {
            const item = items.find(i => i.id === log.itemId);
            if (item && item.isReusable) {
                if (!held[item.id]) held[item.id] = { ...item, heldQty: 0 };
                if (log.action === 'used' || log.action === 'consume') {
                    held[item.id].heldQty += (log.quantity || 0);
                } else if (log.action === 'returned') {
                    held[item.id].heldQty -= (log.quantity || 0);
                }
            }
        });
        return Object.values(held).filter(i => i.heldQty > 0);
    }, [roomLogs, items]);

    // Calculate consumed standard items
    const consumedItems = useMemo(() => {
        const consumed = {};
        roomLogs.forEach(log => {
            const item = items.find(i => i.id === log.itemId);
            if (item && !item.isReusable && (log.action === 'used' || log.action === 'consume')) {
                if (!consumed[item.id]) consumed[item.id] = { ...item, totalConsumed: 0 };
                consumed[item.id].totalConsumed += (log.quantity || 0);
            }
        });
        return Object.values(consumed).sort((a, b) => b.totalConsumed - a.totalConsumed);
    }, [roomLogs, items]);

    // Calculate Room Standards (Bedroom only)
    const isBedroom = room?.primaryRole === 'bedroom' || room?.isGenerated;

    // Available Reusable Items from global stock
    const availableItems = useMemo(() => {
        if (!isOpen || !items) return [];
        return items.filter(item => item.isReusable && !item.deleted);
    }, [isOpen, items]);

    // Now it's safe to return early since all hooks have been called unconditionally
    if (!isOpen || !room) return null;

    const handleReturn = (item) => {
        // Return 1 quantity back to global stock
        onLog(room.id, fullName, item.id, item.name, 'returned', 1, new Date());
    };

    const handleAssign = (req) => {
        // Assign 1 required item from global stock to this room
        onLog(room.id, fullName, req.itemId, req.label, 'used', 1, new Date());
    };

    const handleBedSizeChange = async (newSize) => {
        setIsEditingBedSize(false);
        if (newSize === room.bedSize) return;

        // Find if this is a virtual room attached to a person, or an explicit location
        if (room.isGenerated && room.entityType === 'location' && room.id.startsWith('virtual-room-')) {
            // It's a virtual room built from someone's room number. 
            // We need to update the person document who 'owns' this room.
            // But since we only have the room object here, and we need the person ID,
            // we will let the higher level handle it by passing the entityType as 'virtual-room'
            await onUpdate(room.id, { bedSize: newSize, entityType: 'virtual-room' });
        } else {
            // Explicit location
            await onUpdate(room.id, { bedSize: newSize });
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-3xl shadow-lg">
                            {room.avatar || '📍'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{fullName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    {room.primaryRole || 'Location'}
                                </span>

                                {isBedroom && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-700">•</span>
                                        {isEditingBedSize ? (
                                            <select
                                                autoFocus
                                                value={roomBedSize || 'Twin'}
                                                onChange={(e) => handleBedSizeChange(e.target.value)}
                                                onBlur={() => setIsEditingBedSize(false)}
                                                className="text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-primary-600 dark:text-primary-400 focus:outline-none focus:border-primary-500 shadow-sm"
                                            >
                                                <option value="Twin">Twin</option>
                                                <option value="Double">Double</option>
                                                <option value="Queen">Queen</option>
                                                <option value="King">King</option>
                                            </select>
                                        ) : canEdit && onUpdate ? (
                                            <button
                                                onClick={() => setIsEditingBedSize(true)}
                                                className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 uppercase tracking-widest flex items-center gap-1 group"
                                                title="Change Bed Size"
                                            >
                                                {roomBedSize || 'Twin'} Bed
                                                <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                                                {roomBedSize || 'Twin'} Bed
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
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

                    {/* Available Storage Items Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span>📦</span> Reusable Items Assigned
                            </h3>
                            {canEdit && (
                                <button
                                    onClick={() => setIsAssigning(!isAssigning)}
                                    className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isAssigning
                                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                        : 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50'
                                        }`}
                                >
                                    {isAssigning ? 'Done Assigning' : '+ Assign Item'}
                                </button>
                            )}
                        </div>

                        {/* Assignment Panel */}
                        {isAssigning && (
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Available from Storage</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {availableItems.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500 text-sm">No reusable items in storage.</div>
                                    ) : (
                                        availableItems.map(item => {
                                            const heldCount = heldItems.find(i => i.id === item.id)?.heldQty || 0;
                                            return (
                                                <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">{item.icon}</div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</div>
                                                            <div className="text-xs font-semibold text-gray-500">
                                                                <span className={heldCount > 0 ? "text-primary-600 dark:text-primary-400 font-bold" : ""}>{heldCount} in use</span>
                                                                <span className="opacity-50 mx-1">•</span>
                                                                {item.currentStock || 0} in storage
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleReturn(item)}
                                                            disabled={heldCount === 0}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/40 dark:hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
                                                            title="Return 1"
                                                        >
                                                            -
                                                        </button>
                                                        <button
                                                            onClick={() => handleAssign({ itemId: item.id, label: item.name })}
                                                            disabled={(item.currentStock || 0) <= 0}
                                                            className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold tracking-widest transition-colors shadow-sm"
                                                            title="Assign 1"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {heldItems.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                                <p className="text-gray-500 dark:text-gray-400 font-semibold mb-3">No reusable items currently held.</p>
                                {canEdit && (
                                    <button
                                        onClick={() => setIsAssigning(true)}
                                        className="px-4 py-2 bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-bold rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <span className="text-lg leading-none">+</span> Assign items from storage
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {heldItems.map(item => {
                                    // Find remaining storage stock from global items
                                    const globalItem = items.find(i => i.id === item.id);
                                    const remainingStock = globalItem ? (globalItem.currentStock || 0) : 0;

                                    return (
                                        <div key={item.id} className="p-3 bg-gray-50 dark:bg-[#1a1f2e] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                            {/* Top: Icon + Name + Actions */}
                                            <div className="flex items-center justify-between mb-3 w-full">
                                                <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                                                    <div className="text-2xl shrink-0">{item.icon}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{item.name}</div>
                                                </div>
                                                {canEdit && (
                                                    <div className="flex items-center gap-1.5 shrink-0 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-lg border border-gray-200 dark:border-gray-700/50">
                                                        <button
                                                            onClick={() => handleReturn(item)}
                                                            className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/20 dark:hover:text-amber-400 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                                                            title="Return 1"
                                                            disabled={item.heldQty <= 0}
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleAssign({ itemId: item.id, label: item.name })}
                                                            className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/20 dark:hover:text-primary-400 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                                                            title="Assign 1"
                                                            disabled={remainingStock <= 0}
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Bottom: Compact Stats */}
                                            <div className="flex items-center justify-between bg-gray-100/50 dark:bg-[#111420]/50 rounded-lg p-2 border border-gray-100 dark:border-white/5">
                                                <div className="flex flex-col items-center justify-center px-3 border-r border-gray-200 dark:border-gray-700 w-1/2">
                                                    <div className="text-gray-900 dark:text-white font-black text-sm leading-none">{item.heldQty}</div>
                                                    <div className="text-gray-500 dark:text-gray-400 text-[9px] uppercase font-bold tracking-widest mt-1">Assigned</div>
                                                </div>
                                                <div className="flex flex-col items-center justify-center px-3 w-1/2">
                                                    <div className="text-gray-600 dark:text-gray-300 font-black text-sm leading-none">{remainingStock}</div>
                                                    <div className="text-gray-400 dark:text-gray-500 text-[9px] uppercase font-bold tracking-widest mt-1">Storage</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Consumed Section */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span>🛒</span> Total Consumed Consumables
                        </h3>
                        {consumedItems.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 font-semibold">No consumable items logged here yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {consumedItems.map(item => (
                                    <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center gap-2">
                                        <div className="text-3xl">{item.icon}</div>
                                        <div className="w-full">
                                            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.name}</div>
                                            <div className="text-xs font-black text-amber-500 mt-0.5">{item.totalConsumed} used</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>,
        document.body
    );
}

