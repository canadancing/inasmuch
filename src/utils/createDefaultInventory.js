// One-time script to create default inventory for existing user
// Run this in browser console

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase/config';

export async function createDefaultInventoryForCurrentUser() {
    const user = auth.currentUser;

    if (!user) {
        console.error('No user signed in');
        return;
    }

    try {
        const inventoryId = `inv_${user.uid}_${Date.now()}`;

        const inventoryRef = await addDoc(collection(db, 'inventories'), {
            id: inventoryId,
            ownerId: user.uid,
            name: `${user.displayName || 'My'} Inventory`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            collaborators: {}
        });

        console.log('✅ Created default inventory:', inventoryRef.id);
        alert('✅ Default inventory created! Refresh the page.');
        return inventoryRef.id;
    } catch (error) {
        console.error('Error creating inventory:', error);
        alert('Failed to create inventory: ' + error.message);
    }
}

// Auto-run if this file is imported
if (typeof window !== 'undefined') {
    window.createDefaultInventory = createDefaultInventoryForCurrentUser;
    console.log('Run: window.createDefaultInventory()');
}
