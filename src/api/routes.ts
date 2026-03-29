import { Express, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { dbClient } from '../db/client';
import { sessionManager } from '../core/session-manager';
import { documentProcessor } from '../core/document-processor';
import { conversationalEngine } from '../core/conversational-engine';
import { documentGenerator } from '../core/document-generator';
import { exporter } from '../core/exporter';

const upload = multer({ storage: multer.memoryStorage() });

export function setupRoutes(app: Express) {
    const requireAuth = (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token no provisto' });
        }
        (req as any).userId = 'desarrollo-user-id';
        next();
    };

    app.post('/projects', requireAuth, async (req, res) => {
        try {
            const p = await sessionManager.createProject((req as any).userId);
            res.status(201).json(p);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    app.get('/projects', requireAuth, async (req, res) => {
        try {
            const p = await sessionManager.listUserProjects((req as any).userId);
            res.status(200).json(p);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/projects/:id/books', requireAuth, upload.single('file'), async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
            const result = await documentProcessor.ingestMethodologyBook(req.file.buffer, req.file.originalname, req.params.id);
            res.status(202).json(result);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    });

    app.post('/projects/:id/articles', requireAuth, upload.single('file'), async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
            const result = await documentProcessor.ingestScientificArticle(req.file.buffer, req.file.originalname, req.params.id);
            res.status(200).json(result);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    });

    app.post('/projects/:id/interview/start', requireAuth, async (req, res) => {
        try {
            const result = await conversationalEngine.startInterview(req.params.id, "session-id-dummy");
            res.status(200).json(result);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    });

    app.post('/projects/:id/interview/respond', requireAuth, async (req, res) => {
        try {
            const result = await conversationalEngine.processUserResponse(req.params.id, "session-id-dummy", req.body.message);
            res.status(200).json(result);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    });

    app.get('/projects/:id/components', requireAuth, async (req, res) => {
        try {
            const result = await conversationalEngine.getComponentsSummary(req.params.id);
            res.status(200).json(result);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    });

    app.post('/projects/:id/components/confirm', requireAuth, async (req, res) => {
        try {
            await conversationalEngine.confirmComponents(req.params.id, req.body.components);
            res.status(200).json({ success: true });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    });

    app.post('/projects/:id/document', requireAuth, async (req, res) => {
        try {
            const doc = await documentGenerator.generateFinalDocument(req.params.id);
            res.status(200).json(doc);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    });

    app.get('/projects/:id/document/export', requireAuth, async (req, res) => {
        try {
            // Mocking fetch the document here
            const doc = await documentGenerator.generateFinalDocument(req.params.id);

            if (req.query.format === 'pdf') {
                const buffer = await exporter.exportToPdf(doc);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=proyecto.pdf');
                res.send(buffer);
            } else {
                const buffer = await exporter.exportToDocx(doc);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', 'attachment; filename=proyecto.docx');
                res.send(buffer);
            }
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    });
}
