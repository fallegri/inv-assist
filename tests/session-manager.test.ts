import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { dbClient } from '../src/db/client';
import { PostgresSessionManager } from '../src/core/session-manager';
import { SessionState, components } from '../src/types';

describe('SessionManager and Database Properties', () => {
    let sessionManager: PostgresSessionManager;

    beforeAll(async () => {
        // We assume the DB is running and migrations applied for the test environment.
        await dbClient.connect();
        // Run migrations just in case (useful for local test DBs)
        await dbClient.runMigrations();
        sessionManager = new PostgresSessionManager();
    });

    afterAll(async () => {
        // Clean up projects to avoid cluttering the DB
        await dbClient.getPool().query('DELETE FROM projects');
        await dbClient.close();
    });

    describe('Property 21: Unicidad de identificadores de proyecto', () => {
        it('Feature: asistente-proyectos-grado, Property 21: todos los IDs de proyecto son únicos', async () => {
            // Usamos numRuns pequeño por la latencia hacia la base de datos real
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 2, max: 20 }),
                    async (count) => {
                        const userId = 'test-user-prop-21';
                        const projects = await Promise.all(
                            Array.from({ length: count }, () => sessionManager.createProject(userId))
                        );
                        const ids = projects.map(p => p.projectId);
                        return new Set(ids).size === ids.length;
                    }
                ),
                { numRuns: 10 }
            );
        });
    });

    describe('Property 22: Round-trip de persistencia de sesión', () => {
        it('Feature: asistente-proyectos-grado, Property 22: recuperar el estado devuelve datos idénticos', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 10 }), // random history
                    fc.constantFrom(
                        'context_confirmation',
                        'problem_identification',
                        'general_objective',
                        'completed'
                    ),
                    async (randomText, phase) => {
                        const project = await sessionManager.createProject('test-user-prop-22');

                        const stateToSave: SessionState = {
                            projectId: project.projectId,
                            conversationHistory: [
                                { role: 'user', content: randomText, timestamp: new Date() }
                            ],
                            currentPhase: phase as any,
                            components: {
                                generalProblem: 'Problem ' + randomText
                            }
                        };

                        await sessionManager.saveSessionState(project.projectId, stateToSave);
                        const loadedState = await sessionManager.loadSessionState(project.projectId);

                        expect(loadedState).not.toBeNull();
                        if (!loadedState) return false;

                        // Checking fields match
                        expect(loadedState.projectId).toBe(stateToSave.projectId);
                        expect(loadedState.currentPhase).toBe(stateToSave.currentPhase);
                        expect(loadedState.components.generalProblem).toBe(stateToSave.components.generalProblem);

                        // Verify inside fast check
                        return loadedState.projectId === stateToSave.projectId &&
                            loadedState.currentPhase === stateToSave.currentPhase &&
                            loadedState.components.generalProblem === stateToSave.components.generalProblem;
                    }
                ),
                { numRuns: 10 }
            );
        });
    });

    describe('Unit Tests for SessionManager', () => {
        it('creates a project, retrieves it, lists it, and handles project not found', async () => {
            const userId = 'user-unit-tests';
            const project = await sessionManager.createProject(userId);
            expect(project.projectId).toBeDefined();
            expect(project.status).toBe('in_progress');

            const retrieved = await sessionManager.getProject(project.projectId);
            expect(retrieved.projectId).toBe(project.projectId);

            const list = await sessionManager.listUserProjects(userId);
            expect(list.length).toBeGreaterThanOrEqual(1);
            expect(list.some(p => p.projectId === project.projectId)).toBe(true);

            await expect(sessionManager.getProject('00000000-0000-0000-0000-000000000000'))
                .rejects.toThrow();
        });
    });
});
