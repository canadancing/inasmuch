import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function getItems() {
    const snapshot = await db.collectionGroup('items').get();
    console.log(`Found ${snapshot.size} items across all inventories.`);
    snapshot.forEach(doc => {
        console.log(doc.ref.path, '=>', doc.data().name, doc.data().category, doc.data().icon);
    });
}

getItems().catch(console.error);
