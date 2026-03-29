import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import WebSocket from 'ws';
import * as dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { setupWebSocket } from './ws';
import { dbClient } from '../db/client';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

setupRoutes(app);
setupWebSocket(wss);

const PORT = process.env.PORT || 3000;

async function start() {
    await dbClient.connect();
    server.listen(PORT, () => {
        console.log(`Servidor API del Asistente de Proyectos de Grado ejecutándose en el puerto ${PORT}`);
    });
}

start().catch(console.error);
