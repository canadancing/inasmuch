import { useState } from 'react';

export default function AddPersonModal({ isOpen, onClose, onAdd, tags = [] }) {
    const [step, setStep] = useState(1); // 1 = choose type, 2 = fill form
    const [entityType, setEntityType] = useState('person'); // 'person' or 'location'
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        room: '',
        displayName: '',
        locationId: '',
        tags: [],
        notes: ''
    });

    if (!isOpen) return null;

    const handleTypeSelect = (type) => {
        setEntityType(type);
        setStep(2);
        // Auto-add 'common' tag for locations
        if (type === 'location') {
            setFormData(prev => ({ ...prev, tags: ['common'] }));
        }
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
            tags: formData.tags,
            notes: formData.notes
        };

        if (entityType === 'person') {
            // Person: use firstName, lastName, etc.
            entityData.firstName = formData.firstName.trim();
            entityData.lastName = formData.lastName.trim();
            entityData.phone = formData.phone.trim();
            entityData.room = formData.room.trim();
        } else {
            // Location: use displayName, clear firstName/lastName
            entityData.displayName = formData.displayName.trim();
            entityData.room = formData.locationId.trim(); // Use room field for locationId (backward compat)
            entityData.firstName = '';
            entityData.lastName = '';
        }

        await onAdd(entityData);
        handleClose();
    };

    const handleClose = () => {
        setStep(1);
        setEntityType('person');
        setFormData({
            firstName: '',
            lastName: '',
            phone: '',
            room: '',
            displayName: '',
            locationId: '',
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
                            {step === 1 ? 'Add Person or Location' : entityType === 'person' ? 'Add Person' : 'Add Location'}
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
                                            Resident, staff member, or donor
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
                    ) : (
                        /* Step 2: Fill Form */
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
                                </>
                            )}

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    🏷️ Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
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
                    {step === 2 && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Back
                            </button>
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
