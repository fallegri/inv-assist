import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PostgresConversationalEngine } from '../src/core/conversational-engine';

describe('ConversationalEngine properties', () => {
    const engine = new PostgresConversationalEngine();

    it('Feature: asistente-proyectos-grado, Property 4: contextos con menos de 50 palabras son rechazados', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1 }), { maxLength: 49 }),
                (words) => {
                    const shortContext = words.join(' ');
                    const result = engine.validateInitialContext(shortContext);
                    return result.isValid === false;
                }
            ),
            { numRuns: 100 }
        );
    });
});
