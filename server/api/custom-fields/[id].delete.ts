// DELETE /api/custom-fields/:id — remover definição (histórico íntegro via cache) §6.
import { requireAuth, notImplemented } from '../../utils/http'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  // TODO(§6): remover afeta só lançamentos futuros; snapshots antigos usam _label/_type;
  //   writeAudit('CUSTOM_FIELD_REMOVE').
  void _id
  return notImplemented('§6')
})
