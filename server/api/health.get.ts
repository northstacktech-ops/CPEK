import { checkDatabaseHealth } from '../utils/dbHealth'

export default defineEventHandler(async (event) => {
  try {
    await checkDatabaseHealth()
    return {
      status: 'ok',
      service: 'cpek',
      database: 'ok',
      ts: Date.now(),
      region: process.env.VERCEL_REGION ?? 'local',
    }
  } catch {
    setResponseStatus(event, 503)
    return {
      status: 'degraded',
      service: 'cpek',
      database: 'unavailable',
      ts: Date.now(),
      region: process.env.VERCEL_REGION ?? 'local',
    }
  }
})
