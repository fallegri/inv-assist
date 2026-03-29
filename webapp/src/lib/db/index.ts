import { Pool } from 'pg';

// Utilizando una única instancia global del pool para evitar 
// fatigar la DB con múltiples conexiones en desarrollo con Hot Reload.
const globalForPg = global as unknown as { pool: Pool };

export const pool =
  globalForPg.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Aquí puedes configurar SSL si al hacer deploy en Supabase/Neon lo requiere:
    // ssl: { rejectUnauthorized: false }
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
