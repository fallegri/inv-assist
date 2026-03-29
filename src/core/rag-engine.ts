import { getFirestoreDb } from '../db/firebase';
import { RAGEngine, ChunkMetadata } from '../types';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

function cosineSimilarity(A: number[], B: number[]): number {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < A.length; i++) {
        dotproduct += (A[i] * B[i]);
        mA += (A[i] * A[i]);
        mB += (B[i] * B[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    return dotproduct / (mA * mB);
}

export class FirebaseRAGEngine implements RAGEngine {
    private embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: process.env.GEMINI_API_KEY
    });

    async retrieve(query: string, projectId: string, limit: number = 5): Promise<ChunkMetadata[]> {
        const queryVector = await this.embeddings.embedQuery(query);
        const db = getFirestoreDb();

        const snapshot = await db.collection('book_chunks').where('projectId', '==', projectId).get();
        if (snapshot.empty) throw new Error("Base de conocimiento vacía. No existen libros metodológicos indexados para este proyecto.");

        let scoredChunks = snapshot.docs.map(doc => {
            const data = doc.data();
            const similarity = cosineSimilarity(queryVector, data.embedding);
            return {
                fragmentId: doc.id,
                bookTitle: data.bookTitle,
                pageNumber: data.pageNumber,
                content: data.content,
                score: similarity
            };
        });

        scoredChunks = scoredChunks.filter(c => c.score >= 0.65).sort((a, b) => b.score - a.score);

        if (scoredChunks.length === 0) {
            throw new Error("No se encontraron fragmentos con relevancia suficiente en la base de conocimiento metodológica.");
        }

        return scoredChunks.slice(0, limit);
    }
}

export const ragEngine = new FirebaseRAGEngine();
