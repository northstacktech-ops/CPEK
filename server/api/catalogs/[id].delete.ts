// DELETE /api/catalogs/:id — remover valor de catálogo (preferir desativar) §5.
import { requireAuth, notImplemented } from '../../utils/http'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  void _id
  // TODO(§5): preferir active=false; excluir só se sem referências.
  return notImplemented('§5')
})
