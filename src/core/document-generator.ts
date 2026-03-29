import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { getFirestoreDb } from '../db/firebase';
import { sessionManager } from './session-manager';
import { ragEngine } from './rag-engine';
import { DocumentGenerator, StateOfArtTable, StateOfArtEntry, FinalDocument, DocumentSection, ArticleMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export class FirebaseDocumentGenerator implements DocumentGenerator {
    private chat = new ChatGoogleGenerativeAI({
        modelName: "gemini-2.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.5
    });

    async generateStateOfArt(projectId: string): Promise<StateOfArtTable> {
        const db = getFirestoreDb();
        const snap = await db.collection('scientific_articles').where('projectId', '==', projectId).get();

        const articles: ArticleMetadata[] = snap.docs.map(r => ({
            articleId: r.id,
            title: r.data().title,
            authors: r.data().authors,
            year: r.data().year,
            abstract: r.data().abstract,
            methodology: r.data().methodology,
            mainResults: r.data().mainResults,
            conclusions: r.data().conclusions,
            missingFields: r.data().missingFields
        })).sort((a, b) => b.year - a.year);

        if (articles.length === 0) {
            throw new Error("No hay artículos cargados para generar el Estado de la Cuestión.");
        }

        const session = await sessionManager.loadSessionState(projectId);
        const problem = session?.components?.generalProblem || "";

        const entries: StateOfArtEntry[] = [];

        for (const article of articles) {
            const prompt = `
        Genera una entrada para el Estado de la Cuestión en estricto español:
        Título: ${article.title}
        Autores: ${article.authors.join(', ')}
        Año: ${article.year}
        Metodología: ${article.methodology}
        Resultados: ${article.mainResults}
        
        El problema de investigación de nuestro proyecto es: "${problem}"
      `;

            const EntrySchema = z.object({
                bibliographicReference: z.string(),
                addressedProblem: z.string(),
                methodology: z.string(),
                results: z.string(),
                relationToResearch: z.string(),
            });

            const structuredLlm = this.chat.withStructuredOutput(EntrySchema);
            const output = await structuredLlm.invoke(prompt);

            entries.push({
                article,
                ...output
            });
        }

        return {
            entries,
            generatedAt: new Date()
        };
    }

    async updateStateOfArt(projectId: string, modifications: string): Promise<StateOfArtTable> {
        return await this.generateStateOfArt(projectId);
    }

    async generateFinalDocument(projectId: string): Promise<FinalDocument> {
        const session = await sessionManager.loadSessionState(projectId);
        if (!session || !session.components) throw new Error("Faltan componentes para generar el documento.");

        const comps = session.components;
        const documentId = uuidv4();

        const fragments = await ragEngine.retrieve('Cómo redactar una introducción', projectId, 3);
        const ragContext = fragments.map(f => f.content).join('\n\n');

        const prompt = `
      Eres un redactor académico experto. Escribe en estricto español formal.
      Utiliza este contexto metodológico: ${ragContext}
      
      Problema General: ${comps.generalProblem}
      Problemas Específicos: ${comps.specificProblems?.join(', ')}
      Objetivo General: ${comps.generalObjective}
      Objetivos Específicos: ${comps.specificObjectives?.join(', ')}
      
      Genera las secciones documentales en estricto español coherente.
    `;

        const DocumentSchema = z.object({
            introduction: z.string().describe("Introducción de al menos 150 palabras"),
            researchProblematic: z.string().describe("Problemática de investigación de al menos 100 palabras"),
            researchProblem: z.string(),
            generalObjective: z.string(),
            specificObjectives: z.string(),
            isCoherent: z.boolean().describe("¿Son coherentes lógicamente los específicos con el general?")
        });

        const structuredLlm = this.chat.withStructuredOutput(DocumentSchema);
        const output = await structuredLlm.invoke(prompt);

        if (!output.isCoherent) {
            throw new Error("Los objetivos generados no son metodológicamente coherentes entre sí.");
        }

        const stateOfArt = await this.generateStateOfArt(projectId);

        const doc: FinalDocument = {
            documentId,
            projectId,
            sections: {
                introduction: output.introduction,
                researchProblematic: output.researchProblematic,
                researchProblem: output.researchProblem,
                generalObjective: output.generalObjective,
                specificObjectives: output.specificObjectives,
                stateOfArt
            },
            generatedAt: new Date()
        };

        const db = getFirestoreDb();
        await db.collection('final_documents').doc(projectId).set({
            documentId,
            ...doc.sections,
            generatedAt: doc.generatedAt
        });

        return doc;
    }

    async regenerateSection(projectId: string, section: DocumentSection): Promise<string> {
        return "Regenerando la sección según especificaciones en español mediante Gemini.";
    }
}

export const documentGenerator = new FirebaseDocumentGenerator();
