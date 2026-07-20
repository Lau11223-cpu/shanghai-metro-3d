import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { pool, query } from './db.js'

const app = express()
const PORT = Number(process.env.PORT) || 3000

// ==== 中间件 ====
app.use(cors())
app.use(express.json())

// ==== 简易请求日志 ====
app.use((req, _res, next) => {
  console.log(`[api] ${req.method} ${req.path}`)
  next()
})

// ==== /health 路由 ====
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const result = await query<{ version: string }>('SELECT PostGIS_Version() AS version')
    res.json({
      status: 'ok',
      postgis_version: result.rows[0].version,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[health] db check failed:', err)
    res.status(503).json({
      status: 'error',
      message: err instanceof Error ? err.message : 'unknown error',
      timestamp: new Date().toISOString(),
    })
  }
})

// ==== 启动服务 ====
const server = app.listen(PORT, () => {
  console.log(`[api] server listening on http://localhost:${PORT}`)
  console.log(`[api] try: http://localhost:${PORT}/health`)
})

// ==== 优雅关闭 ====
async function shutdown(signal: string) {
  console.log(`\n[api] received ${signal}, shutting down gracefully...`)
  server.close(() => {
    console.log('[api] http server closed')
  })
  await pool.end()
  console.log('[db] pool drained')
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))