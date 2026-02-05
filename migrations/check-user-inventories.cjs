// Quick script to check if user Ew9suLteeCXVGdEnTkEaDDOdVJj1 has any inventories
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const targetUid = 'Ew9suLteeCXVGdEnTkEaDDOdVJj1';

async function checkUserInventories() {
    console.log(`\n🔍 Checking inventories for user: ${targetUid}\n`);

    // Check owned inventories
    const ownedSnapshot = await db.collection('inventories')
        .where('ownerId', '==', targetUid)
        .get();

    console.log(`📦 Owned Inventories: ${ownedSnapshot.docs.length}`);
    ownedSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}`);
        console.log(`     Name: ${data.name || 'Unnamed'}`);
        console.log(`     collaboratorUids: ${JSON.stringify(data.collaboratorUids || [])}`);
    });

    // Check collaborated inventories
    const collabSnapshot = await db.collection('inventories')
        .where('collaboratorUids', 'array-contains', targetUid)
        .get();

    console.log(`\n🤝 Collaborated Inventories: ${collabSnapshot.docs.length}`);
    collabSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}`);
        console.log(`     Owner: ${data.ownerId}`);
        console.log(`     Name: ${data.name || 'Unnamed'}`);
    });

    console.log('\n✅ Check complete\n');
    process.exit(0);
}

checkUserInventories().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
