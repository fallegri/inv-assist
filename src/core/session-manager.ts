import { getFirestoreDb } from '../db/firebase';
import { SessionManager, Project, SessionState } from '../types';

export class FirebaseSessionManager implements SessionManager {
    async createProject(userId: string): Promise<Project> {
        const db = getFirestoreDb();
        const docRef = db.collection('projects').doc();
        const project: Project = {
            id: docRef.id,
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await docRef.set(project);
        return project;
    }

    async getProject(projectId: string): Promise<Project> {
        const db = getFirestoreDb();
        const doc = await db.collection('projects').doc(projectId).get();
        if (!doc.exists) throw new Error('Project not found');
        const data = doc.data() as Project;
        return {
            ...data,
            createdAt: (data.createdAt as any).toDate ? (data.createdAt as any).toDate() : new Date(data.createdAt),
            updatedAt: (data.updatedAt as any).toDate ? (data.updatedAt as any).toDate() : new Date(data.updatedAt)
        };
    }

    async listUserProjects(userId: string): Promise<Project[]> {
        const db = getFirestoreDb();
        const snapshot = await db.collection('projects').where('userId', '==', userId).get();
        return snapshot.docs.map(doc => {
            const data = doc.data() as Project;
            return {
                ...data,
                id: doc.id,
                createdAt: (data.createdAt as any).toDate ? (data.createdAt as any).toDate() : new Date(data.createdAt),
                updatedAt: (data.updatedAt as any).toDate ? (data.updatedAt as any).toDate() : new Date(data.updatedAt)
            };
        });
    }

    async saveSessionState(projectId: string, state: SessionState): Promise<void> {
        const db = getFirestoreDb();
        await db.collection('session_states').doc(projectId).set(state);
    }

    async loadSessionState(projectId: string): Promise<SessionState | null> {
        const db = getFirestoreDb();
        const doc = await db.collection('session_states').doc(projectId).get();
        if (!doc.exists) return null;
        const data = doc.data() as SessionState;
        if (data.conversationHistory) {
            data.conversationHistory = data.conversationHistory.map(h => ({
                ...h,
                timestamp: (h.timestamp as any).toDate ? (h.timestamp as any).toDate() : new Date(h.timestamp)
            }));
        }
        return data;
    }
}

export const sessionManager = new FirebaseSessionManager();
