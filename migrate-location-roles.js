/**
 * Migration Script: Update Location Entities with Correct Primary Roles
 * 
 * This script safely updates all location entities (identified by entityType: 'location')
 * to have the appropriate primaryRole based on their display name.
 * 
 * Role Mapping:
 * - Kitchen, Living Room, Dining Room, etc. → 'common'
 * - Bathroom, Bathroom 2, etc. → 'bathroom'
 * - Bedroom, Master Bedroom, etc. → 'bedroom'  
 * - Garage, Shed, Storage, etc. → 'utility'
 * - Garden, Patio, Yard, etc. → 'outdoor'
 * 
 * Usage:
 * 1. Make sure you have Node.js installed
 * 2. Run: node migrate-location-roles.js
 * 3. Review the proposed changes
 * 4. Type 'yes' to apply them
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import * as readline from 'readline';

// Your Firebase config (from src/firebase/config.js)
const firebaseConfig = {
    apiKey: "AIzaSyAGLvDLf2OmhpXIlOlcGt01Z5fU31rC4mk",
    authDomain: "inasmuch-d8f6e.firebaseapp.com",
    projectId: "inasmuch-d8f6e",
    storageBucket: "inasmuch-d8f6e.firebasestorage.app",
    messagingSenderId: "625815530361",
    appId: "1:625815530361:web:99ea71e8ca8dbcec0ddaa7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Role detection logic based on display name
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
    return 'common';
}

// Main migration function
async function migrateLocationRoles() {
    console.log('🔍 Scanning for location entities...\n');

    try {
        // Get all residents (which includes both people and locations)
        const residentsRef = collection(db, 'residents');
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
            process.exit(0);
        }

        console.log(`Found ${updates.length} location(s) that need role updates:\n`);

        // Display proposed changes
        updates.forEach((update, index) => {
            console.log(`${index + 1}. "${update.displayName}"`);
            console.log(`   Current: ${update.currentRole}`);
            console.log(`   New:     ${update.newRole}`);
            console.log('');
        });

        // Confirm with user
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('\n✋ Apply these changes? (yes/no): ', async (answer) => {
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                console.log('\n🚀 Applying updates...\n');

                let successCount = 0;
                for (const update of updates) {
                    try {
                        const docRef = doc(db, 'residents', update.id);
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
            } else {
                console.log('\n❌ Migration cancelled. No changes were made.');
            }

            rl.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

// Run migration
migrateLocationRoles();
