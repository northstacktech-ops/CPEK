// Health-check público (sem auth) — usado pelo deploy/CI. Não toca dado de negócio.
export default defineEventHandler(() => ({ status: 'ok', service: 'cpek', ts: Date.now() }))
