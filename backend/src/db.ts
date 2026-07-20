import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('[db] unexpected pool error:', err)
})

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  const start = Date.now()
  const result = await pool.query<T>(text, params as unknown[])
  const duration = Date.now() - start
  console.log(`[db] ${duration}ms — rows: ${result.rowCount} — ${text.split('\n')[0].trim()}`)
  return result
}