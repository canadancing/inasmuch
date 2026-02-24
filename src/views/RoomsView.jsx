import { useState, useMemo } from 'react';
import StatusBadge from '../components/StatusBadge';
import RoomDetailModal from '../components/RoomDetailModal';
import AddPersonModal from '../components/AddPersonModal';
import StandardsModal from '../components/StandardsModal';

export default function RoomsView({ residents = [], items = [], logs = [], onAddResident, onUpdateResident, onDeleteResident, tags = [], onUpdateItem, onLog, standards = [], addStandard, deleteStandard, canEdit = true }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStandardsModal, setShowStandardsModal] = useState(false);

    // Filter locations & auto-generate bedrooms
    const rooms = useMemo(() => {
        const generatedRooms = new Map();

        // 1. Add explicit locations
        residents.filter(r =>
            !r.deleted && r.status !== 'moved_out' &&
            (r.entityType === 'location' ||
                ['common', 'kitchen', 'bathroom', 'bedroom', 'garage', 'utility', 'outdoor'].includes(r.primaryRole))
        ).forEach(room => {
            const fullName = room.displayName || room.name || `${room.firstName || ''} ${room.lastName || ''}`.trim() || 'Unknown Room';
            generatedRooms.set(fullName.toLowerCase(), { ...room, isGenerated: false, name: fullName });
        });

        // 2. Add implicit bedrooms from residents
        residents.filter(r =>
            !r.deleted && r.status !== 'moved_out' && r.entityType !== 'location' && r.room
        ).forEach(person => {
            const roomNum = person.room.toString().trim();
            if (!roomNum) return;

            const roomNameStr = roomNum.toLowerCase().startsWith('room') ? roomNum : `Room ${roomNum}`;
            const key = roomNameStr.toLowerCase();

            if (!generatedRooms.has(key)) {
                generatedRooms.set(key, {
                    id: `virtual-room-${roomNum}`,
                    name: roomNameStr,
                    isGenerated: true,
                    entityType: 'location',
                    primaryRole: 'bedroom',
                    bedSize: person.bedSize || 'Twin'
                });
            }
        });

        return Array.from(generatedRooms.values()).map(room => {
            const fullName = room.name;

            // Get all logs for this room
            const roomLogs = logs.filter(log =>
                log.residentName === fullName || log.residentId === room.id
            );

            // Calculate Reusable Items Currently Held
            const heldItems = {};
            let heldCount = 0;
            roomLogs.forEach(log => {
                const item = items.find(i => i.id === log.itemId);
                if (item && item.isReusable) {
                    if (!heldItems[item.id]) heldItems[item.id] = { ...item, heldQty: 0 };
                    if (log.action === 'used' || log.action === 'consume') {
                        heldItems[item.id].heldQty += (log.quantity || 0);
                    } else if (log.action === 'returned') {
                        heldItems[item.id].heldQty -= (log.quantity || 0);
                    }
                }
            });
            Object.values(heldItems).forEach(i => {
                if (i.heldQty > 0) heldCount += i.heldQty;
            });

            // Calculate total consumables used (all time)
            const totalUses = roomLogs
                .filter(log => (log.action === 'used' || log.action === 'consume'))
                .filter(log => {
                    const i = items.find(it => it.id === log.itemId);
                    return !i?.isReusable; // only consumables
                })
                .reduce((sum, log) => sum + (log.quantity || 0), 0);

            // Calculate activity level based on last 7 days of everything
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentUses = roomLogs.filter(log => {
                const logDate = log.date?.toDate?.() || new Date(log.date);
                return logDate >= sevenDaysAgo && (log.action === 'used' || log.action === 'consume');
            }).reduce((sum, log) => sum + (log.quantity || 0), 0);

            let activityLevel = 'low';
            if (recentUses >= 10) activityLevel = 'high';
            else if (recentUses >= 5) activityLevel = 'medium';

            return {
                ...room,
                name: fullName,
                avatar: fullName.charAt(0).toUpperCase(),
                totalUses,
                heldCount,
                activityLevel
            };
        });
    }, [residents, logs, items]);

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            return room.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [rooms, searchQuery]);

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
        setShowDetailModal(true);
    };

    return (
        <div className="flex-1 overflow-y-auto pb-24">
            <div className="p-8">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <span>📍</span> ROOMS & LOCATIONS
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Track items held and consumed by specific locations.
                        </p>
                    </div>
                </div>

                {/* Actions and Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowStandardsModal(true)}
                            className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <span>📋</span> Standards
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 shadow-lg shadow-primary-500/20 active:scale-95 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Location
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {filteredRooms.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4 opacity-30">🏡</div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">No locations found</p>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Create locations like 'Garage' or 'Kitchen' to start tracking.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRooms.map(room => (
                            <button
                                key={room.id}
                                onClick={() => handleRoomClick(room)}
                                className="card-interactive bg-white dark:bg-gray-800 p-5 rounded-2xl flex flex-col gap-4 border border-gray-100 dark:border-gray-700 shadow-sm text-left hover:border-primary-500 dark:hover:border-primary-500 group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-110 transition-transform">
                                            {room.avatar || '📍'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">{room.name}</h3>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {room.primaryRole ? room.primaryRole.charAt(0).toUpperCase() + room.primaryRole.slice(1) : 'Location'}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={room.activityLevel === 'high' ? 'active' : room.activityLevel === 'medium' ? 'warning' : 'dormant'} />
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">Holding</div>
                                        <div className="text-xl font-black text-primary-600 dark:text-primary-400">
                                            {room.heldCount} <span className="text-sm font-semibold opacity-50">items</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">Consumed</div>
                                        <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                                            {room.totalUses} <span className="text-sm font-semibold opacity-50">items</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <RoomDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                room={selectedRoom}
                items={items}
                logs={logs}
                onUpdate={onUpdateResident}
                onDelete={onDeleteResident}
                onLog={onLog}
                standards={standards}
                canEdit={canEdit}
                onEditStandards={() => {
                    setShowDetailModal(false);
                    setShowStandardsModal(true);
                }}
            />

            <AddPersonModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={(data) => onAddResident({ ...data, entityType: 'location' })}
                tags={tags}
                presetType="location"
            />

            <StandardsModal
                isOpen={showStandardsModal}
                onClose={() => setShowStandardsModal(false)}
                standards={standards}
                items={items}
                onAdd={addStandard}
                onDelete={deleteStandard}
            />
        </div>
    );
}

