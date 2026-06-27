// ============================================================================
// CPEK — E2E: vazamento por endpoint (ARCHITECTURE §15, complemento da matriz).
//
// Para cada endpoint que retorna dado de tenant, autentica como tenant A e tenta
// acessar um `id` pertencente a B → espera 404/vazio. Cobre o caso de "rota
// especial que escapou do filtro".
//
// Pré-requisitos (ver tests/README.md):
//   - app rodando (webServer do playwright.config sobe `pnpm preview`);
//   - dois usuários de teste (A e B) em tenants distintos, com recursos semeados;
//   - tokens em env: E2E_TOKEN_A, E2E_TOKEN_B; e ids de recurso de B em E2E_B_*.
// ============================================================================
import { expect, test } from '@playwright/test'

const TOKEN_A = process.env.E2E_TOKEN_A
const B = {
  companyId: process.env.E2E_B_COMPANY_ID,
  entryId: process.env.E2E_B_ENTRY_ID,
  exitId: process.env.E2E_B_EXIT_ID,
  closingId: process.env.E2E_B_CLOSING_ID,
  contactId: process.env.E2E_B_CONTACT_ID,
}

// Endpoints que recebem um id de recurso na URL e devem negar cross-tenant.
const CROSS_TENANT_GETS: Array<{ name: string; path: () => string | undefined }> = [
  { name: 'GET /api/entries/:id (B)', path: () => B.entryId && `/api/entries/${B.entryId}` },
  { name: 'GET /api/exits/:id (B)', path: () => B.exitId && `/api/exits/${B.exitId}` },
  { name: 'GET /api/closings/:id (B)', path: () => B.closingId && `/api/closings/${B.closingId}` },
  { name: 'GET /api/contacts/:id (B)', path: () => B.contactId && `/api/contacts/${B.contactId}` },
]

test.describe('Vazamento por endpoint (A não acessa recursos de B)', () => {
  test.skip(!TOKEN_A, 'Defina E2E_TOKEN_A e os E2E_B_* para rodar (ver tests/README.md).')

  for (const ep of CROSS_TENANT_GETS) {
    test(ep.name, async ({ request }) => {
      const path = ep.path()
      test.skip(!path, `id de B ausente para ${ep.name}`)
      const res = await request.get(path!, {
        headers: { authorization: `Bearer ${TOKEN_A}` },
      })
      // Esperado: 404 (não encontrado no tenant A) — nunca 200 com dados de B.
      expect([403, 404]).toContain(res.status())
    })
  }

  test('listagens só retornam dados do próprio tenant', async ({ request }) => {
    const res = await request.get('/api/companies', {
      headers: { authorization: `Bearer ${TOKEN_A}` },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const items: Array<{ id: string }> = body.items ?? body
    expect(items.some((c) => c.id === B.companyId)).toBe(false)
  })
})
