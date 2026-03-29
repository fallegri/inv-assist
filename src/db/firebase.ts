import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();

let db: admin.firestore.Firestore;

export function getFirestoreDb(): admin.firestore.Firestore {
    if (!db) {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
        }
        db = admin.firestore();
    }
    return db;
}
