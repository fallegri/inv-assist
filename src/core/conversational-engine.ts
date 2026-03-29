import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { getFirestoreDb } from '../db/firebase';
import { ragEngine } from './rag-engine';
import { sessionManager } from './session-manager';
import { ConversationalEngine, ConversationTurn, InterviewPhase, ComponentType, ResearchComponents, CollectionInstrument, SessionState } from '../types';
import { z } from 'zod';

export class FirebaseConversationalEngine implements ConversationalEngine {
    private chat = new ChatGoogleGenerativeAI({
        modelName: "gemini-2.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.7
    });

    validateInitialContext(context: string): { isValid: boolean; errorMessage?: string; sanitizedContext: string } {
        const words = context.trim().split(/\s+/);
        if (words.length < 50) {
            return {
                isValid: false,
                errorMessage: 'El contexto inicial es demasiado breve. Por favor, amplíe la descripción con al menos 50 palabras para poder guiarle mejor.',
                sanitizedContext: context
            };
        }
        const sanitizedContext = context.replace(/(ignora|instrucciones previas|system prompt|bypass|as a system)/gi, '[REMOVIDO]');
        return { isValid: true, sanitizedContext };
    }

    async transcribeAudio(audioBuffer: Buffer, fileName: string): Promise<string> {
        throw new Error('Esta funcionalidad de transcripción de audio requiere integración nativa configurada para Gemini Speech (vía Vertex/GCP).');
    }

    async startInterview(projectId: string, sessionId: string): Promise<ConversationTurn> {
        const session = await sessionManager.loadSessionState(projectId);
        if (!session) {
            throw new Error('Sesión no encontrada');
        }

        const firstQuestion = "¿Podría confirmarme si la descripción del contexto que me ha proporcionado aborda todos los aspectos clave de la empresa o problema observado, o hay algún detalle adicional que debamos tener en cuenta antes de empezar?";

        session.conversationHistory.push({ role: 'assistant', content: firstQuestion, timestamp: new Date() });
        session.currentPhase = 'context_confirmation';
        await sessionManager.saveSessionState(projectId, session);

        return {
            message: firstQuestion,
            phase: 'context_confirmation',
            componentBeingBuilt: 'none',
            isComplete: false
        };
    }

    async processUserResponse(projectId: string, sessionId: string, userMessage: string): Promise<ConversationTurn> {
        const session = await sessionManager.loadSessionState(projectId);
        if (!session) throw new Error('Sesión no encontrada');

        const ragContext = await ragEngine.retrieve(`Metodología para plantear ${session.currentPhase}`, projectId, 3);
        const contextStr = ragContext.map(r => `Fuente: ${r.bookTitle} p.${r.pageNumber}\nContenido: ${r.content}`).join('\n\n');

        const EvaluationSchema = z.object({
            isSufficient: z.boolean().describe("¿Es la respuesta del usuario suficiente para avanzar de fase?"),
            nextMessage: z.string().describe("La respuesta y siguiente pregunta a enviar al usuario en estricto español."),
            identifiedComponent: z.string().optional().describe("Si se logró identificar un componente, el texto condensado."),
            moveToNextPhase: z.boolean().describe("¿Debe el sistema avanzar a la siguiente fase?"),
            suggestedInstruments: z.array(z.object({
                type: z.enum(['structured_interview', 'semi_structured_interview', 'questionnaire', 'focus_group', 'brainstorming', 'direct_observation']),
                justification: z.string()
            })).optional()
        });

        const prompt = `
      Eres el Asistente de Proyectos de Grado, un experto metodológico de investigación. Toda tu comunicación DEBE ser estrictamente en español. JAMÁS en inglés.
      
      Historia:
      ${session.conversationHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}
      Usuario: ${userMessage}
      
      Fase actual: ${session.currentPhase}
      
      Criterios metodológicos leídos (RAG Gemini):
      ${contextStr}
      
      Evalúa si la respuesta del usuario tiene sentido, es de más de 20 palabras y responde la fase. Si es insuficiente o escueta, pregunta por detalles (nextMessage) en español.
      Si es suficiente, consolida y sugiere avanzar. Emite los instrumentos si corresponde a recolección de datos y los ves apropiados según contexto metodológico.
    `;

        const structuredLlm = this.chat.withStructuredOutput(EvaluationSchema);
        const evaluation = await structuredLlm.invoke(prompt);

        session.conversationHistory.push({ role: 'user', content: userMessage, timestamp: new Date() });
        session.conversationHistory.push({ role: 'assistant', content: evaluation.nextMessage, timestamp: new Date() });

        if (evaluation.moveToNextPhase) {
            if (session.currentPhase === 'context_confirmation') {
                session.currentPhase = 'problem_identification';
            } else if (session.currentPhase === 'problem_identification') {
                session.components.generalProblem = evaluation.identifiedComponent;
                session.currentPhase = 'specific_problems';
            } else if (session.currentPhase === 'specific_problems') {
                session.components.specificProblems = evaluation.identifiedComponent?.split('\n') || [];
                session.currentPhase = 'general_objective';
            } else if (session.currentPhase === 'general_objective') {
                session.components.generalObjective = evaluation.identifiedComponent;
                session.currentPhase = 'specific_objectives';
            } else if (session.currentPhase === 'specific_objectives') {
                session.components.specificObjectives = evaluation.identifiedComponent?.split('\n') || [];
                session.currentPhase = 'summary_validation';
            }
        }

        await sessionManager.saveSessionState(projectId, session);

        return {
            message: evaluation.nextMessage,
            phase: session.currentPhase,
            componentBeingBuilt: this.mapPhaseToComponent(session.currentPhase),
            isComplete: session.currentPhase === 'summary_validation',
            suggestedInstruments: evaluation.suggestedInstruments as CollectionInstrument[] | undefined,
            citations: ragContext.map(r => ({ bookTitle: r.bookTitle, pageNumber: r.pageNumber, fragmentId: r.fragmentId }))
        };
    }

    private mapPhaseToComponent(phase: InterviewPhase): ComponentType {
        if (phase === 'problem_identification') return 'general_problem';
        if (phase === 'specific_problems') return 'specific_problems';
        if (phase === 'general_objective') return 'general_objective';
        if (phase === 'specific_objectives') return 'specific_objectives';
        return 'none';
    }

    async getComponentsSummary(projectId: string): Promise<ResearchComponents> {
        const session = await sessionManager.loadSessionState(projectId);
        if (!session || !session.components) throw new Error('No components found for this project.');
        return session.components as ResearchComponents;
    }

    async confirmComponents(projectId: string, components: ResearchComponents): Promise<void> {
        const session = await sessionManager.loadSessionState(projectId);
        if (!session) throw new Error('No session');

        components.confirmedAt = new Date();
        session.components = components;
        session.currentPhase = 'completed';

        await sessionManager.saveSessionState(projectId, session);

        const db = getFirestoreDb();
        await db.collection('research_components').doc(projectId).set(components);
    }
}

export const conversationalEngine = new FirebaseConversationalEngine();
