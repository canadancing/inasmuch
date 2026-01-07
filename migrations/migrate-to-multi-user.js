// Migration script for converting to multi-user per-inventory ownership
import { db } from '../src/firebase/config';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { generateUniqueUserId, generateInventoryId } from '../src/firebase/userIdUtils';

/**
 * MIGRATION SCRIPT - RUN ONCE
 * 
 * This script migrates the current single-inventory structure to multi-user inventories.
 * 
 * Steps:
 * 1. Assign 6-digit user IDs to all users
 * 2. Create default inventory for each user
 * 3. Migrate items, residents, and logs to user's inventory
 * 
 * IMPORTANT: Backup your Firestore database before running!
 */

async function migrateToMultiUser() {
    console.log('🚀 Starting migration to multi-user inventory system...\n');

    try {
        // Step 1: Get all users
        console.log('📋 Step 1: Fetching all users...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log(`   Found ${usersSnapshot.docs.length} users\n`);

        // Step 2: Assign user IDs
        console.log('🔢 Step 2: Assigning 6-digit user IDs...');
        for (const userDoc of usersSnapshot.docs) {
            try {
                const userId = await generateUniqueUserId();
                await setDoc(doc(db, 'users', userDoc.id), {
                    userId
                }, { merge: true });
                console.log(`   ✅ ${userDoc.data().displayName || userDoc.id} → ID: ${userId}`);
            } catch (error) {
                console.error(`   ❌ Failed to assign ID to user ${userDoc.id}:`, error);
            }
        }
        console.log('');

        // Step 3: Get current shared data
        console.log('📦 Step 3: Fetching shared data...');
        const itemsSnapshot = await getDocs(collection(db, 'items'));
        const residentsSnapshot = await getDocs(collection(db, 'residents'));
        const logsSnapshot = await getDocs(collection(db, 'logs'));
        console.log(`   Items: ${itemsSnapshot.docs.length}`);
        console.log(`   Residents: ${residentsSnapshot.docs.length}`);
        console.log(`   Logs: ${logsSnapshot.docs.length}\n`);

        // Step 4: Create inventory for each user and migrate data
        console.log('🏗️  Step 4: Creating inventories and migrating data...');
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const inventoryId = generateInventoryId(userDoc.id);

            console.log(`\n   Creating inventory for ${userData.displayName || userDoc.id}...`);

            // Create inventory
            await setDoc(doc(db, 'inventories', inventoryId), {
                id: inventoryId,
                ownerId: userDoc.id,
                name: `${userData.displayName || 'My'} Inventory`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                collaborators: {}
            });
            console.log(`   ✅ Created inventory: ${inventoryId}`);

            // Migrate items
            console.log(`   📦 Migrating ${itemsSnapshot.docs.length} items...`);
            const itemBatch = writeBatch(db);
            itemsSnapshot.docs.forEach(itemDoc => {
                const itemData = itemDoc.data();
                const newItemRef = doc(db, 'inventories', inventoryId, 'items', itemDoc.id);
                itemBatch.set(newItemRef, {
                    ...itemData,
                    createdBy: userDoc.id,
                    updatedBy: userDoc.id,
                    createdAt: itemData.createdAt || serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });
            await itemBatch.commit();
            console.log(`   ✅ Items migrated`);

            // Migrate residents
            console.log(`   👥 Migrating ${residentsSnapshot.docs.length} residents...`);
            const residentBatch = writeBatch(db);
            residentsSnapshot.docs.forEach(residentDoc => {
                const residentData = residentDoc.data();
                const newResidentRef = doc(db, 'inventories', inventoryId, 'residents', residentDoc.id);
                residentBatch.set(newResidentRef, {
                    ...residentData,
                    createdBy: userDoc.id,
                    updatedBy: userDoc.id,
                    createdAt: residentData.createdAt || serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });
            await residentBatch.commit();
            console.log(`   ✅ Residents migrated`);

            // Migrate logs
            console.log(`   📝 Migrating ${logsSnapshot.docs.length} logs...`);
            const logBatch = writeBatch(db);
            logsSnapshot.docs.forEach(logDoc => {
                const logData = logDoc.data();
                const newLogRef = doc(db, 'inventories', inventoryId, 'logs', logDoc.id);
                logBatch.set(newLogRef, {
                    ...logData,
                    performedBy: logData.performedBy || userDoc.id,
                    performedByName: logData.performedByName || userData.displayName || 'Unknown'
                });
            });
            await logBatch.commit();
            console.log(`   ✅ Logs migrated`);
        }

        console.log('\n✅ Migration completed successfully!\n');
        console.log('⚠️  NEXT STEPS:');
        console.log('1. Verify the data in Firestore console');
        console.log('2. Test the app with the new structure');
        console.log('3. Once confirmed, delete old collections:');
        console.log('   - items');
        console.log('   - residents');
        console.log('   - logs');
        console.log('4. Deploy new Firestore security rules\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.log('\n⚠️  Please restore from backup and try again.\n');
    }
}

// Export for manual execution
export { migrateToMultiUser };

// Uncomment to run:
// migrateToMultiUser();
