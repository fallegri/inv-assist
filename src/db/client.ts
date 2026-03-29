import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

class DatabaseClient {
    private pool: Pool;
    private isConnected = false;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            // Consider adding ssl options if required in production
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    async connect(): Promise<void> {
        if (!this.isConnected) {
            await this.pool.connect();
            this.isConnected = true;
            console.log('Connected to PostgreSQL Database');
        }
    }

    async runMigrations(): Promise<void> {
        try {
            await this.connect();
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await this.pool.query(schema);
            console.log('Database schema applied successfully.');
        } catch (error) {
            console.error('Failed to run migrations', error);
            throw error;
        }
    }

    getPool(): Pool {
        return this.pool;
    }

    async close(): Promise<void> {
        await this.pool.end();
        this.isConnected = false;
    }
}

export const dbClient = new DatabaseClient();
