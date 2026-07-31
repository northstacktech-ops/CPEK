import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.customField.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Campo customizado não encontrado')
    // Hard-delete incondicional (diferente dos outros cadastros): o valor já
    // fica congelado em customSnapshot (fieldKey + _label + _type) em cada
    // lançamento — não há leitura ao vivo do CustomField para exibir histórico,
    // então apagar de vez aqui nunca corrompe um lançamento antigo (§6.3).
    await tx.customField.delete({ where: { id } })
    await writeAudit(tx, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: 'CUSTOM_FIELD_REMOVE',
      entity: 'CustomField',
      entityId: id,
    })
    return { ok: true }
  })
})
