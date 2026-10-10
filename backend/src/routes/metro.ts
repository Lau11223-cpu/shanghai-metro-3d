import { Router, type Request, type Response } from 'express'
import { query } from '../db.js'

type GeoJsonGeometry = {
  type: string
  coordinates: unknown
}

type MetroLineRow = {
  ref: string
  name: string | null
  operator: string | null
  colour: string | null
  geometry: GeoJsonGeometry
}

const router = Router()

router.get('/lines', async (_req: Request, res: Response) => {
  try {
    const result = await query<MetroLineRow>(`
      SELECT
        ref,
        MAX(name) AS name,
        MAX(operator) AS operator,
        MAX(colour) AS colour,
        ST_AsGeoJSON(
          ST_LineMerge(ST_Collect(geom))
        )::json AS geometry
      FROM metro.lines
      WHERE ref IS NOT NULL
        AND geom IS NOT NULL
      GROUP BY ref
      ORDER BY
        MIN(CAST(substring(ref from '^[0-9]+') AS integer)),
        ref
    `)

    const features = result.rows.map(({ geometry, ...properties }) => ({
      type: 'Feature' as const,
      properties,
      geometry,
    }))

    res.json({
      type: 'FeatureCollection',
      features,
    })
  } catch (err) {
    console.error('[metro] failed to load lines:', err)
    res.status(500).json({
      status: 'error',
      message: 'Failed to load metro lines',
    })
  }
})



router.get('/stations', async (_req, res) => {
  try {
    const result = await query(`
      SELECT
        name,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM metro.stations
      WHERE geom IS NOT NULL
      ORDER BY name
    `)

    res.json({
      type: 'FeatureCollection',
      features: result.rows.map((row) => ({
        type: 'Feature',
        properties: {
          name: row.name,
        },
        geometry: row.geometry,
      })),
    })
  } catch (error) {
    console.error('[metro/stations] query failed:', error)
    res.status(500).json({
      error: 'Failed to load metro stations',
    })
  }
})



export default router