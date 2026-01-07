// Type definitions for multi-user inventory system

/**
 * @typedef {Object} Inventory
 * @property {string} id - Unique inventory ID
 * @property {string} ownerId - Firebase UID of the owner
 * @property {string} name - Inventory name
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Object.<string, CollaboratorPermission>} collaborators - Map of UID to permission
 */

/**
 * @typedef {Object} CollaboratorPermission
 * @property {'view' | 'edit'} permission - Access level
 * @property {Date} grantedAt - When access was granted
 * @property {string} grantedBy - UID of who granted access
 */

/**
 * @typedef {Object} AccessRequest
 * @property {string} id - Unique request ID
 * @property {string} requesterId - UID of requester
 * @property {string} requesterName - Display name of requester
 * @property {string} requesterPhoto - Photo URL of requester
 * @property {string} inventoryId - Target inventory ID
 * @property {string} inventoryName - Name of inventory
 * @property {string} ownerId - UID of inventory owner
 * @property {'view' | 'edit'} permission - Requested permission level
 * @property {'pending' | 'approved' | 'rejected'} status - Request status
 * @property {Date} createdAt - When request was created
 * @property {Date} respondedAt - When request was responded to
 * @property {string} message - Optional message from requester
 */

/**
 * @typedef {Object} UserPermission
 * @property {boolean} isOwner - User owns this inventory
 * @property {boolean} canView - User can view inventory
 * @property {boolean} canEdit - User can edit items/residents/logs
 * @property {boolean} canDelete - User can delete items/residents
 * @property {boolean} canManageAccess - User can manage collaborators
 * @property {'owner' | 'edit' | 'view' | null} role - User's role
 */

export const PermissionLevel = {
    VIEW: 'view',
    EDIT: 'edit'
};

export const RequestStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

/**
 * Calculate user's permissions for an inventory
 * @param {string} userId - User's Firebase UID
 * @param {Inventory} inventory - The inventory object
 * @returns {UserPermission}
 */
export function calculatePermissions(inventory, userId) {
    if (!inventory || !userId) {
        return {
            isOwner: false,
            canView: false,
            canEdit: false,
            canDelete: false,
            canManageAccess: false,
            role: null
        };
    }

    const isOwner = inventory.ownerId === userId;
    const collaborator = inventory.collaborators?.[userId];
    const hasEditAccess = collaborator?.permission === PermissionLevel.EDIT;
    const hasViewAccess = collaborator?.permission === PermissionLevel.VIEW;

    return {
        isOwner,
        canView: isOwner || hasEditAccess || hasViewAccess,
        canEdit: isOwner || hasEditAccess,
        canDelete: isOwner,
        canManageAccess: isOwner,
        role: isOwner ? 'owner' : (hasEditAccess ? 'edit' : (hasViewAccess ? 'view' : null))
    };
}
