// Utility function to generate unique 6-digit user IDs
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';

/**
 * Generates a unique 6-digit numeric user ID
 * Checks for collisions and retries if needed
 * @returns {Promise<string>} A unique 6-digit ID as a string
 */
export async function generateUniqueUserId() {
    const maxRetries = 10;

    for (let i = 0; i < maxRetries; i++) {
        // Generate random 6-digit number (100000-999999)
        const userId = Math.floor(100000 + Math.random() * 900000).toString();

        // Check if this ID already exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return userId;
        }

        console.warn(`User ID collision detected: ${userId}, retrying... (${i + 1}/${maxRetries})`);
    }

    throw new Error('Failed to generate unique user ID after maximum retries');
}

/**
 * Creates a new inventory for a user
 * @param {string} ownerId - Firebase UID of the owner
 * @param {string} name - Name of the inventory
 * @returns {string} The generated inventory ID
 */
export function generateInventoryId(ownerId) {
    return `inv_${ownerId}_${Date.now()}`;
}
