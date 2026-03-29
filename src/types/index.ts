// Tipos base para archivos y Buffers en Node.js (usando interfaces simétricas al diseño original)

export interface DocumentProcessor {
    ingestMethodologyBook(fileBuffer: Buffer, fileName: string, projectId: string): Promise<IngestionResult>;
    ingestScientificArticle(fileBuffer: Buffer, fileName: string, projectId: string): Promise<ArticleMetadata>;
    getIngestionStatus(jobId: string): Promise<IngestionStatus>;
}

export interface IngestionResult {
    jobId: string;
    bookId: string;
    status: 'processing' | 'completed' | 'failed';
    pageCount?: number;
    errorMessage?: string;
}

export interface ArticleMetadata {
    articleId: string;
    title: string;
    authors: string[];
    year: number;
    abstract: string;
    methodology: string;
    mainResults: string;
    conclusions: string;
    missingFields: string[];
}

export interface IngestionStatus {
    jobId: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    errorMessage?: string;
}

export interface RAGEngine {
    retrieve(query: string, projectId: string, topK?: number): Promise<RetrievedFragment[]>;
    retrieveFromBook(query: string, bookId: string, topK?: number): Promise<RetrievedFragment[]>;
}

export interface RetrievedFragment {
    fragmentId: string;
    content: string;
    bookId: string;
    bookTitle: string;
    pageNumber: number;
    relevanceScore: number;
}

export interface ConversationalEngine {
    startInterview(projectId: string, sessionId: string): Promise<ConversationTurn>;
    processUserResponse(projectId: string, sessionId: string, userMessage: string): Promise<ConversationTurn>;
    getComponentsSummary(projectId: string): Promise<ResearchComponents>;
    confirmComponents(projectId: string, components: ResearchComponents): Promise<void>;
    validateInitialContext(context: string): { isValid: boolean; errorMessage?: string; sanitizedContext: string };
}

export interface ConversationTurn {
    message: string;
    phase: InterviewPhase;
    componentBeingBuilt: ComponentType;
    isComplete: boolean;
    suggestedInstruments?: CollectionInstrument[];
    citations?: Citation[];
}

export type InterviewPhase =
    | 'context_confirmation'
    | 'problem_identification'
    | 'specific_problems'
    | 'general_objective'
    | 'specific_objectives'
    | 'summary_validation'
    | 'completed';

export type ComponentType =
    | 'general_problem'
    | 'specific_problems'
    | 'general_objective'
    | 'specific_objectives'
    | 'collection_instruments'
    | 'none';

export interface Citation {
    bookTitle: string;
    pageNumber: number;
    fragmentId: string;
}

export interface ResearchComponents {
    generalProblem: string;
    specificProblems: string[];
    generalObjective: string;
    specificObjectives: string[];
    suggestedInstruments: CollectionInstrument[];
    confirmedAt?: Date;
}

export interface CollectionInstrument {
    type: 'structured_interview' | 'semi_structured_interview' | 'questionnaire'
    | 'focus_group' | 'brainstorming' | 'direct_observation';
    justification: string;
    applicationGuide?: string;
    sourceFragment?: RetrievedFragment;
}

export interface SessionManager {
    createProject(userId: string): Promise<Project>;
    getProject(projectId: string): Promise<Project>;
    listUserProjects(userId: string): Promise<ProjectSummary[]>;
    saveSessionState(projectId: string, state: SessionState): Promise<void>;
    loadSessionState(projectId: string): Promise<SessionState | null>;
}

export interface ProjectSummary {
    projectId: string;
    status: 'in_progress' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}

export interface Project {
    projectId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    status: 'in_progress' | 'completed';
    knowledgeBase: KnowledgeBaseInfo;
    articles: ArticleMetadata[];
    components?: ResearchComponents;
    finalDocument?: FinalDocumentInfo;
}

export interface KnowledgeBaseInfo {
    booksIndexed: number;
    totalChunks: number;
}

export interface FinalDocumentInfo {
    documentId: string;
    generatedAt: Date;
}

export interface ConversationMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface SessionState {
    projectId: string;
    conversationHistory: ConversationMessage[];
    currentPhase: InterviewPhase;
    components: Partial<ResearchComponents>;
    stateOfArt?: StateOfArtTable;
    finalDocument?: FinalDocumentInfo;
}

export interface DocumentGenerator {
    generateStateOfArt(projectId: string): Promise<StateOfArtTable>;
    updateStateOfArt(projectId: string, modifications: string): Promise<StateOfArtTable>;
    generateFinalDocument(projectId: string): Promise<FinalDocument>;
    regenerateSection(projectId: string, section: DocumentSection): Promise<string>;
}

export interface StateOfArtTable {
    entries: StateOfArtEntry[];
    generatedAt: Date;
}

export interface StateOfArtEntry {
    article: ArticleMetadata;
    bibliographicReference: string;
    addressedProblem: string;
    methodology: string;
    results: string;
    relationToResearch: string;
}

export interface FinalDocument {
    documentId: string;
    projectId: string;
    sections: {
        introduction: string;
        researchProblematic: string;
        researchProblem: string;
        generalObjective: string;
        specificObjectives: string;
        stateOfArt: StateOfArtTable;
    };
    generatedAt: Date;
}

export type DocumentSection =
    | 'introduction'
    | 'researchProblematic'
    | 'researchProblem'
    | 'generalObjective'
    | 'specificObjectives'
    | 'stateOfArt';

export interface Exporter {
    exportToDocx(document: FinalDocument): Promise<Buffer>;
    exportToPdf(document: FinalDocument): Promise<Buffer>;
}
