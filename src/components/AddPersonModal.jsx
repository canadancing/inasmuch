import { useState } from 'react';
import RoleBadge from './RoleBadge';

export default function AddPersonModal({ isOpen, onClose, onAdd, tags = [], presetType = null }) {
    const [step, setStep] = useState(presetType ? 2 : 1); // 1 = choose type, 2 = choose role, 3 = fill form
    const [entityType, setEntityType] = useState(presetType || 'person'); // 'person' or 'location'
    const [primaryRole, setPrimaryRole] = useState(''); // resident, guest, temporary, staff, donor, common, etc.
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        room: '',
        bedSize: 'Twin',
        displayName: '',
        locationId: '',
        expectedDepartureDate: '',
        tags: [],
        notes: ''
    });

    if (!isOpen) return null;

    const personRoles = [
        { id: 'resident', icon: '🏠', label: 'Resident', description: 'Permanent house member' },
        { id: 'guest', icon: '🎒', label: 'Guest', description: 'Short-term visitor (<30 days)' },
        { id: 'temporary', icon: '🏕️', label: 'Temp Resident', description: 'Medium-term stay (30-90 days)' },
        { id: 'staff', icon: '🧹', label: 'Staff', description: 'Employee or helper' },
        { id: 'donor', icon: '🎁', label: 'Donor', description: 'Supply contributor' },
        { id: 'volunteer', icon: '👔', label: 'Volunteer', description: 'Community volunteer' }
    ];

    const locationRoles = [
        { id: 'common', icon: '📍', label: 'Common Area', description: 'Shared space' },
        { id: 'kitchen', icon: '🍳', label: 'Kitchen', description: 'Cooking area' },
        { id: 'bathroom', icon: '🚽', label: 'Bathroom', description: 'Bathroom facility' },
        { id: 'bedroom', icon: '🛏️', label: 'Bedroom', description: 'Private room' },
        { id: 'garage', icon: '🚗', label: 'Garage', description: 'Parking/storage' },
        { id: 'utility', icon: '🏢', label: 'Utility', description: 'Service area' },
        { id: 'outdoor', icon: '🌳', label: 'Outdoor', description: 'Outside space' }
    ];

    const handleTypeSelect = (type) => {
        setEntityType(type);
        setStep(2);
    };

    const handleRoleSelect = (role) => {
        setPrimaryRole(role);
        setFormData(prev => ({ ...prev, tags: [role] }));
        setStep(3);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-generate locationId from displayName
        if (field === 'displayName' && entityType === 'location') {
            const id = value.toLowerCase().replace(/\s+/g, '');
            setFormData(prev => ({ ...prev, locationId: id }));
        }
    };

    const handleTagToggle = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const handleSubmit = async () => {
        // Prepare data based on entity type
        const entityData = {
            entityType,
            primaryRole,
            status: 'active',
            tags: formData.tags,
            notes: formData.notes
        };

        if (entityType === 'person') {
            // Person: use firstName, lastName, etc.
            entityData.firstName = formData.firstName.trim();
            entityData.lastName = formData.lastName.trim();
            entityData.phone = formData.phone.trim();
            entityData.room = formData.room.trim();
            entityData.bedSize = formData.bedSize;

            // Add expected departure for temporary residents/guests
            if ((primaryRole === 'guest' || primaryRole === 'temporary') && formData.expectedDepartureDate) {
                entityData.expectedDepartureDate = formData.expectedDepartureDate;
            }
        } else {
            // Location: use displayName, clear firstName/lastName
            entityData.displayName = formData.displayName.trim();
            entityData.room = formData.locationId.trim(); // Use room field for locationId (backward compat)
            entityData.bedSize = formData.bedSize;
            entityData.firstName = '';
            entityData.lastName = '';
        }

        await onAdd(entityData);
        handleClose();
    };

    const handleClose = () => {
        setStep(presetType ? 2 : 1);
        setEntityType(presetType || 'person');
        setPrimaryRole('');
        setFormData({
            firstName: '',
            lastName: '',
            phone: '',
            room: '',
            bedSize: 'Twin',
            displayName: '',
            locationId: '',
            expectedDepartureDate: '',
            tags: [],
            notes: ''
        });
        onClose();
    };

    const isValid = () => {
        if (entityType === 'person') {
            return formData.firstName.trim() && formData.room.trim();
        } else {
            return formData.displayName.trim();
        }
    };

    const isTemporary = primaryRole === 'guest' || primaryRole === 'temporary';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                            {step === 1 ? 'Add Person or Location' :
                                step === 2 ? `Choose ${entityType === 'person' ? 'Role' : 'Location Type'}` :
                                    entityType === 'person' ? 'Add Person' : 'Add Location'}
                        </h2>
                        <button
                            onClick={() => {
                                if (step === 3) {
                                    setStep(presetType ? 2 : 1); // Go back instead of close
                                } else if (step === 2 && !presetType) {
                                    setStep(1);
                                } else {
                                    handleClose();
                                }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {((step === 3 && presetType) || (step > 1 && !presetType)) ? (
                                    // Back arrow icon
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                ) : (
                                    // Close X icon
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                )}
                            </svg>
                        </button>
                    </div>
                    {step === 3 && primaryRole && (
                        <div className="mt-3">
                            <RoleBadge role={primaryRole} size="lg" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 ? (
                        /* Step 1: Choose Type */
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                What would you like to add?
                            </p>

                            <button
                                onClick={() => handleTypeSelect('person')}
                                className="w-full p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl">
                                        👤
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Person</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Resident, staff member, donor, or guest
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleTypeSelect('location')}
                                className="w-full p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl">
                                        📍
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Location</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Kitchen, bathroom, or common area
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    ) : step === 2 ? (
                        /* Step 2: Choose Role */
                        <div className="space-y-3">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {entityType === 'person' ? 'What is their primary role?' : 'What type of location?'}
                            </p>

                            {(entityType === 'person' ? personRoles : locationRoles).map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleSelect(role.id)}
                                    className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{role.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">{role.label}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{role.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Step 3: Fill Form */
                        <div className="space-y-4">
                            {entityType === 'person' ? (
                                // Person Form
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => handleChange('firstName', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                                placeholder="John"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => handleChange('lastName', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                                placeholder="Smith"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                📞 Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                                placeholder="555-0123"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                📍 Room *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.room}
                                                onChange={(e) => handleChange('room', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                                placeholder="Room 5"
                                            />
                                        </div>
                                    </div>

                                    {/* Bed Size for Residents in Rooms */}
                                    {formData.room.trim() !== '' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                🛏️ Bed Size
                                            </label>
                                            <select
                                                value={formData.bedSize}
                                                onChange={(e) => handleChange('bedSize', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                            >
                                                <option value="Twin">Twin / Single</option>
                                                <option value="Double">Double / Full</option>
                                                <option value="Queen">Queen</option>
                                                <option value="King">King</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Expected Departure for Temporary/Guest */}
                                    {isTemporary && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                📅 Expected Departure Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.expectedDepartureDate}
                                                onChange={(e) => handleChange('expectedDepartureDate', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                System will remind you 7 days before departure
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                // Location Form
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Location Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => handleChange('displayName', e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                            placeholder="Kitchen, Bathroom 1, etc."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Location ID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.locationId}
                                            onChange={(e) => handleChange('locationId', e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 focus:outline-none"
                                            placeholder="Auto-generated"
                                            disabled
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Auto-generated from location name
                                        </p>
                                    </div>

                                    {/* Bed Size for Bedroom locations */}
                                    {primaryRole === 'bedroom' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                🛏️ Bed Size
                                            </label>
                                            <select
                                                value={formData.bedSize}
                                                onChange={(e) => handleChange('bedSize', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                            >
                                                <option value="Twin">Twin / Single</option>
                                                <option value="Double">Double / Full</option>
                                                <option value="Queen">Queen</option>
                                                <option value="King">King</option>
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Additional Tags */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    🏷️ Additional Tags (Optional)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.filter(tag => tag.name !== primaryRole).map(tag => (
                                        <button
                                            key={tag.name}
                                            onClick={() => handleTagToggle(tag.name)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${formData.tags.includes(tag.name)
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                }`}
                                            style={formData.tags.includes(tag.name) ? {
                                                backgroundColor: tag.color,
                                                color: 'white'
                                            } : {}}
                                        >
                                            {tag.emoji} {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    📝 Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                    rows={3}
                                    placeholder="Any additional information..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    {step > 1 && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(step - 1)}
                                className="flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Back
                            </button>
                            {step === 3 && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!isValid()}
                                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-colors ${isValid()
                                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Add {entityType === 'person' ? 'Person' : 'Location'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
