// CPEK — unit: motor de DRE (ARCHITECTURE §7). Stub: implementar junto da Fase 3.
import { describe, expect, it } from 'vitest'
import { computeMargin } from '../../server/utils/dre'

describe('DRE — fórmulas básicas (§7.1)', () => {
  it('Margem de Contribuição = Receita Op − Custo Op', () => {
    expect(computeMargin(1000, 400)).toBeCloseTo(600, 2)
  })

  it('Margem % = Margem ÷ Receita Op', () => {
    const operatingRevenue: number = 1000
    const margin = computeMargin(operatingRevenue, 400)
    const marginPct = operatingRevenue === 0 ? 0 : margin / operatingRevenue
    expect(marginPct).toBeCloseTo(0.6, 4)
  })

  it('Margem % = 0 quando receita = 0 (evita divisão por zero)', () => {
    const operatingRevenue = 0
    const margin = computeMargin(operatingRevenue, 0)
    const marginPct = operatingRevenue === 0 ? 0 : margin / operatingRevenue
    expect(marginPct).toBe(0)
  })

  // TODO(§7.3): testes de agregação por dreGroup/serviceId/mês e realizado×agendado.
})
