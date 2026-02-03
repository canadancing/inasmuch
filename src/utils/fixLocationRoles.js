import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Detect the correct primary role for a location based on its display name
 */
function detectLocationRole(displayName) {
    const name = displayName.toLowerCase().trim();

    // Bathroom
    if (name.includes('bathroom') || name.includes('bath') || name.includes('restroom') || name.includes('wc')) {
        return 'bathroom';
    }

    // Bedroom
    if (name.includes('bedroom') || name.includes('bed ') || name.includes('master') || name.includes('guest room')) {
        return 'bedroom';
    }

    // Utility
    if (name.includes('garage') || name.includes('shed') || name.includes('storage') ||
        name.includes('laundry') || name.includes('utility') || name.includes('basement') ||
        name.includes('attic') || name.includes('closet')) {
        return 'utility';
    }

    // Outdoor
    if (name.includes('garden') || name.includes('patio') || name.includes('yard') ||
        name.includes('deck') || name.includes('balcony') || name.includes('outdoor') ||
        name.includes('pool') || name.includes('backyard') || name.includes('frontyard')) {
        return 'outdoor';
    }

    // Common (default for locations)
    // Includes: kitchen, living room, dining room, hallway, etc.
    return 'common';
}

/**
 * Fix all location entities to have the correct primaryRole
 * Call this from browser console: window.fixLocationRoles()
 */
export async function fixLocationRoles(inventoryId) {
    if (!inventoryId) {
        console.error('❌ Please provide an inventory ID');
        console.log('Usage: window.fixLocationRoles("your-inventory-id")');
        return;
    }

    console.log('🔍 Scanning for location entities...\n');

    try {
        // Get all residents (which includes both people and locations)
        const residentsRef = collection(db, 'inventories', inventoryId, 'residents');
        const locationQuery = query(residentsRef, where('entityType', '==', 'location'));
        const snapshot = await getDocs(locationQuery);

        const updates = [];

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const displayName = data.displayName || 'Unknown';
            const currentRole = data.primaryRole;
            const detectedRole = detectLocationRole(displayName);

            // Only update if role is missing or different
            if (!currentRole || currentRole !== detectedRole) {
                updates.push({
                    id: docSnap.id,
                    displayName,
                    currentRole: currentRole || '(none)',
                    newRole: detectedRole
                });
            }
        });

        if (updates.length === 0) {
            console.log('✅ No location entities need updating. All roles are correctly set!');
            return { success: true, updated: 0, message: 'No updates needed' };
        }

        console.log(`Found ${updates.length} location(s) that need role updates:\n`);

        // Display proposed changes
        updates.forEach((update, index) => {
            console.log(`${index + 1}. "${update.displayName}"`);
            console.log(`   Current: ${update.currentRole}`);
            console.log(`   New:     ${update.newRole}`);
            console.log('');
        });

        console.log('🚀 Applying updates...\n');

        let successCount = 0;
        for (const update of updates) {
            try {
                const docRef = doc(db, 'inventories', inventoryId, 'residents', update.id);
                await updateDoc(docRef, {
                    primaryRole: update.newRole
                });
                console.log(`✅ Updated "${update.displayName}" → ${update.newRole}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to update "${update.displayName}":`, error.message);
            }
        }

        console.log(`\n🎉 Migration complete! Updated ${successCount}/${updates.length} location(s).`);
        return { success: true, updated: successCount, total: updates.length };

    } catch (error) {
        console.error('❌ Error during migration:', error);
        return { success: false, error: error.message };
    }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
    window.fixLocationRoles = fixLocationRoles;
}
