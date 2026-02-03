import { useState, useMemo } from 'react';
import EntityCard from '../components/EntityCard';
import EntityDetailModal from '../components/EntityDetailModal';
import AddPersonModal from '../components/AddPersonModal';
import StatusBadge from '../components/StatusBadge';
import MoveOutModal from '../components/MoveOutModal';

export default function PeopleView({ residents = [], logs = [], onAddResident, onUpdateResident, onDeleteResident, tags = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'residents', 'guests', 'staff', 'locations'
    const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'moved_out', 'all_statuses'
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showMoveOutModal, setShowMoveOutModal] = useState(false);
    const [moveOutEntity, setMoveOutEntity] = useState(null);


    // Transform residents into entities with calculated stats
    const entities = useMemo(() => {
        return residents.map(resident => {
            // Smart display name logic:
            // 1. Use displayName if it's a location
            // 2. Use existing name property if available
            // 3. Construct from firstName + lastName
            // 4. Fallback to 'Unknown'
            const fullName = resident.displayName ||
                resident.name ||
                `${resident.firstName || ''}  ${resident.lastName || ''}`.trim() ||
                'Unknown';

            // Get all logs for this resident
            const residentLogs = logs.filter(log =>
                log.residentName === fullName || log.residentId === resident.id
            );

            // Calculate total uses
            const totalUses = residentLogs
                .filter(log => log.action === 'used')
                .reduce((sum, log) => sum + (log.quantity || 0), 0);

            // Calculate last active
            const sortedLogs = residentLogs.sort((a, b) => {
                const dateA = a.date?.toDate?.() || new Date(a.date);
                const dateB = b.date?.toDate?.() || new Date(b.date);
                return dateB - dateA;
            });
            const lastActive = sortedLogs[0]?.date?.toDate?.() || sortedLogs[0]?.date;

            // Calculate activity level based on last 7 days
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentUses = residentLogs.filter(log => {
                const logDate = log.date?.toDate?.() || new Date(log.date);
                return logDate >= sevenDaysAgo && log.action === 'used';
            }).reduce((sum, log) => sum + (log.quantity || 0), 0);

            let activityLevel = 'low';
            if (recentUses >= 10) activityLevel = 'high';
            else if (recentUses >= 5) activityLevel = 'medium';

            // Use primaryRole from entity data, with fallback detection
            let primaryRole = resident.primaryRole;
            if (!primaryRole) {
                // Fallback: detect from entityType and tags
                if (resident.entityType === 'location') {
                    primaryRole = 'common'; // Default for locations
                } else {
                    // For people, check tags
                    const residentTags = Array.isArray(resident.tags) ? resident.tags : [];
                    if (residentTags.includes('staff')) primaryRole = 'staff';
                    else if (residentTags.includes('donor')) primaryRole = 'donor';
                    else if (residentTags.includes('guest')) primaryRole = 'guest';
                    else if (residentTags.includes('temporary')) primaryRole = 'temporary';
                    else primaryRole = 'resident';
                }
            }

            return {
                ...resident,
                name: fullName, // Add name property for compatibility
                totalUses,
                lastActive,
                activityLevel,
                primaryRole, // Use primaryRole instead of type
                avatar: fullName.charAt(0).toUpperCase()
            };
        });
    }, [residents, logs]);


    // Filter entities
    const filteredEntities = useMemo(() => {
        return entities.filter(entity => {
            const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase());

            // Role-based filtering
            let matchesRole = true;
            if (roleFilter !== 'all') {
                if (roleFilter === 'residents') {
                    matchesRole = entity.primaryRole === 'resident' || entity.primaryRole === 'temporary';
                } else if (roleFilter === 'guests') {
                    matchesRole = entity.primaryRole === 'guest' || entity.primaryRole === 'temporary';
                } else if (roleFilter === 'staff') {
                    matchesRole = entity.primaryRole === 'staff' || entity.primaryRole === 'donor' || entity.primaryRole === 'volunteer';
                } else if (roleFilter === 'locations') {
                    matchesRole = ['common', 'kitchen', 'bathroom', 'bedroom', 'garage', 'utility', 'outdoor'].includes(entity.primaryRole);
                }
            }

            // Status filter
            const entityStatus = entity.status || 'active';
            const matchesStatus = statusFilter === 'all_statuses' ||
                (statusFilter === 'active' && entityStatus === 'active') ||
                (statusFilter === 'moved_out' && entityStatus === 'moved_out');

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [entities, searchQuery, roleFilter, statusFilter]);

    // Stats overview
    const stats = useMemo(() => {
        return {
            total: entities.length,
            residents: entities.filter(e => ['resident', 'temporary'].includes(e.primaryRole)).length,
            guests: entities.filter(e => e.primaryRole === 'guest').length,
            locations: entities.filter(e => ['common', 'kitchen', 'bathroom', 'bedroom', 'garage', 'utility', 'outdoor'].includes(e.primaryRole)).length,
            staff: entities.filter(e => ['staff', 'donor', 'volunteer'].includes(e.primaryRole)).length,
            mostActive: [...entities].sort((a, b) => b.totalUses - a.totalUses)[0]
        };
    }, [entities]);

    const handleEntityClick = (entity) => {
        setSelectedEntity(entity);
        setShowDetailModal(true);
    };

    const handleMoveOut = async (entityId, moveOutData) => {
        await onUpdateResident(entityId, moveOutData);
    };

    const handleMoveOutClick = (entity) => {
        setMoveOutEntity(entity);
        setShowMoveOutModal(true);
    };

    const handleReactivate = async (entityId) => {
        await onUpdateResident(entityId, { status: 'active', moveOutDate: null });
    };

    return (
        <div className="flex-1 overflow-y-auto pb-24">
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <span>👥</span>
                        PEOPLE
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        View consumption by residents, common areas, and staff
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.total}</div>
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Entities</div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800">
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.residents}</div>
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Residents</div>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800">
                        <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{stats.guests}</div>
                        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Guests</div>
                    </div>
                    <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-200 dark:border-pink-800">
                        <div className="text-3xl font-black text-pink-600 dark:text-pink-400">{stats.locations}</div>
                        <div className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wide">Locations</div>
                    </div>
                </div>

                {/* Most Active Entity */}
                {stats.mostActive && stats.mostActive.totalUses > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-200 dark:border-primary-800">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🏆</span>
                            <div>
                                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Most Active</p>
                                <p className="font-black text-gray-900 dark:text-white">
                                    {stats.mostActive.name} ({stats.mostActive.totalUses} uses)
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Search */}
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search people and locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setRoleFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${roleFilter === 'all'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setRoleFilter('residents')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${roleFilter === 'residents'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            🏠 Residents
                        </button>
                        <button
                            onClick={() => setRoleFilter('guests')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${roleFilter === 'guests'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            🎒 Guests
                        </button>
                        <button
                            onClick={() => setRoleFilter('locations')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${roleFilter === 'locations'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            📍 Locations
                        </button>
                        <button
                            onClick={() => setRoleFilter('staff')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${roleFilter === 'staff'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            💼 Staff
                        </button>

                        {/* Divider */}
                        <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 mx-2"></div>

                        {/* Status Filters */}
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${statusFilter === 'active'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            ✅ Active
                        </button>
                        <button
                            onClick={() => setStatusFilter('moved_out')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${statusFilter === 'moved_out'
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            📦 Moved Out
                        </button>
                    </div>
                </div>

                {/* Entity Grid */}
                {filteredEntities.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4 opacity-30">👥</div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {searchQuery ? 'No results found' : 'No people or locations yet'}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'Try a different search term' : 'Add people from the Admin page'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Add Person or Location Card */}
                        <div
                            onClick={() => setShowAddModal(true)}
                            className="p-5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px]"
                        >
                            <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3">
                                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white text-center">Add Person or Location</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">Click to create</p>
                        </div>

                        {/* Entity Cards */}
                        {filteredEntities.map((entity) => (
                            <EntityCard
                                key={entity.id}
                                entity={entity}
                                onClick={() => handleEntityClick(entity)}
                                onMoveOut={() => handleMoveOutClick(entity)}
                                onReactivate={() => handleReactivate(entity.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Result Count */}
                {filteredEntities.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Showing {filteredEntities.length} of {entities.length} {filteredEntities.length === 1 ? 'entity' : 'entities'}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <EntityDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedEntity(null);
                }}
                entity={selectedEntity}
                logs={logs}
                onUpdate={onUpdateResident}
                onDelete={onDeleteResident}
                tags={tags}
            />

            {/* Add Person Modal */}
            <AddPersonModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={onAddResident}
                tags={tags}
            />

            {/* Move Out Modal */}
            <MoveOutModal
                isOpen={showMoveOutModal}
                onClose={() => {
                    setShowMoveOutModal(false);
                    setMoveOutEntity(null);
                }}
                entity={moveOutEntity}
                onMoveOut={handleMoveOut}
            />
        </div>
    );
}
