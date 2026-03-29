import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { getFirestoreDb } from '../db/firebase';
import { DocumentProcessor, ProcessedBook, AbstractArticleMetadata, BookChunk } from '../types';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import pdfParse from 'pdf-parse';
import { z } from 'zod';

export class FirebaseDocumentProcessor implements DocumentProcessor {
    private embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: process.env.GEMINI_API_KEY
    });

    private chat = new ChatGoogleGenerativeAI({
        modelName: "gemini-2.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.2
    });

    async validateFile(fileBuffer: Buffer, fileName: string): Promise<boolean> {
        if (!fileName.toLowerCase().endsWith('.pdf')) {
            throw new Error('Solo se permiten archivos en formato PDF.');
        }
        if (fileBuffer.length > 50 * 1024 * 1024) {
            throw new Error('El archivo excede el tamaño máximo permitido de 50MB.');
        }
        return true;
    }

    async ingestMethodologyBook(fileBuffer: Buffer, fileName: string, projectId: string): Promise<ProcessedBook> {
        await this.validateFile(fileBuffer, fileName);
        const pdfData = await pdfParse(fileBuffer);

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const rawChunks = await splitter.createDocuments([pdfData.text]);
        const chunks: BookChunk[] = [];

        for (let i = 0; i < rawChunks.length; i++) {
            const content = rawChunks[i].pageContent;
            const vector = await this.embeddings.embedQuery(content);
            chunks.push({
                fragmentId: `chunk_${i}`,
                bookTitle: fileName,
                pageNumber: i + 1,
                content,
                embedding: vector
            });
        }

        const db = getFirestoreDb();
        const batch = db.batch();

        // Firestore batch limits to 500 operations, chunking the chunks inserts 
        const booksRef = db.collection('methodology_books').doc();
        batch.set(booksRef, { projectId, title: fileName, totalPages: pdfData.numpages, uploadedAt: new Date() });

        chunks.forEach(c => {
            const chunkRef = db.collection('book_chunks').doc();
            batch.set(chunkRef, { ...c, projectId, methodologyBookId: booksRef.id });
        });

        await batch.commit();

        return {
            bookId: booksRef.id,
            title: fileName,
            totalPages: pdfData.numpages,
            chunksProcessed: chunks.length
        };
    }

    async ingestScientificArticle(fileBuffer: Buffer, fileName: string, projectId: string): Promise<AbstractArticleMetadata> {
        await this.validateFile(fileBuffer, fileName);

        const db = getFirestoreDb();
        const articlesSnap = await db.collection('scientific_articles').where('projectId', '==', projectId).get();
        if (articlesSnap.size >= 30) {
            throw new Error("Límite de 30 artículos alcanzado para este proyecto.");
        }

        const projectSnap = await db.collection('session_states').doc(projectId).get();
        const session = projectSnap.data();
        const projectProblem = session?.components?.generalProblem || "No definido aún";

        const pdfData = await pdfParse(fileBuffer);
        const firstPages = pdfData.text.substring(0, 5000);

        const prompt = `
            Extrae los metadatos del artículo de los primeros caracteres proveídos:
            ${firstPages}
            
            Evalúa si este artículo guarda una relación temática MEDIANA o ESTRECHA con el problema general del proyecto:
            "${projectProblem}"

            Si el artículo es puramente de otra área y no aporta metodología o tema al problema, isCoherent: false.
            Escribe todos los resultados en español.
        `;

        const LLMSchema = z.object({
            title: z.string(),
            authors: z.array(z.string()),
            year: z.number().nullable(),
            abstract: z.string().optional(),
            methodology: z.string().optional(),
            mainResults: z.string().optional(),
            conclusions: z.string().optional(),
            isCoherent: z.boolean().describe("¿Es coherente y relevante para el problema?")
        });

        const structuredLlm = this.chat.withStructuredOutput(LLMSchema);
        const extraction = await structuredLlm.invoke(prompt);

        if (!extraction.isCoherent) {
            throw new Error("El artículo subido no presenta coherencia mínima con el problema trazado.");
        }

        const missingFields: string[] = [];
        if (!extraction.abstract) missingFields.push('abstract');
        if (!extraction.methodology) missingFields.push('methodology');
        if (!extraction.mainResults) missingFields.push('main_results');
        if (!extraction.conclusions) missingFields.push('conclusions');

        const articleData = {
            projectId,
            title: extraction.title,
            authors: extraction.authors,
            year: extraction.year || new Date().getFullYear(),
            abstract: extraction.abstract || "",
            methodology: extraction.methodology || "",
            mainResults: extraction.mainResults || "",
            conclusions: extraction.conclusions || "",
            missingFields,
            uploadedAt: new Date()
        };

        const docRef = await db.collection('scientific_articles').add(articleData);

        return {
            articleId: docRef.id,
            ...articleData
        };
    }
}

export const documentProcessor = new FirebaseDocumentProcessor();
