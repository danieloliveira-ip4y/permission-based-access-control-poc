import { describe, expect, it } from 'vitest'
import { salaryAdvancePermissionTree } from '@/mocks/permission-tree.mock'
import {
  cloneTree,
  collectAssigned,
  collectAssignedKeys,
  nodeCheckState,
  toSavePayload,
  toggleNode,
} from '../services/permission-tree.service'

describe('permission-tree.service', () => {
  it('collects only nodes with assigned true', () => {
    const tree = cloneTree(salaryAdvancePermissionTree)
    const assigned = collectAssigned(tree)

    expect(assigned.map((node) => node.description)).toEqual([
      'Listar Financeiras',
      'Adicionar Financeiras',
      'Atualizar Comissão',
      'Definir Conta Movimento',
      'Definir Conta Desembolso',
      'Definir Limites Automáticos',
      'Procurar Financeira',
      'Listar Modalidade',
      'Analisar Antecipação (exemplo)',
    ])
    expect(collectAssignedKeys(tree)).toEqual([
      'financeiras.list',
      'financeiras.create',
      'financeiras.commission.update',
      'financeiras.account.movement.set',
      'financeiras.account.disbursement.set',
      'financeiras.limits.auto.set',
      'financeiras.search',
      'modalidades.list',
      'antecipacao.analyze',
    ])
  })

  it('toggles a leaf and then restores it', () => {
    const tree = cloneTree(salaryAdvancePermissionTree)
    const analisar = tree[0]?.children.find(
      (node) => node.description === 'Analisar Antecipação (exemplo)',
    )
    expect(analisar?.uuid).toBe('6e2970c2-8f5b-431f-a101-63f58767f5ba')
    if (!analisar) {
      throw new Error('Analisar Antecipação not found')
    }

    expect(toggleNode(analisar)).toBe(false)
    expect(analisar.assigned).toBe(false)
    expect(toggleNode(analisar)).toBe(true)
    expect(analisar.assigned).toBe(true)
  })

  it('cascades a group checkbox to all descendants', () => {
    const tree = cloneTree(salaryAdvancePermissionTree)
    const financeira = tree[0]?.children.find((node) => node.description === 'Financeira')
    if (!financeira) {
      throw new Error('Financeira not found')
    }

    expect(nodeCheckState(financeira)).toBe('checked')
    expect(toggleNode(financeira)).toBe(false)
    expect(nodeCheckState(financeira)).toBe('unchecked')
    expect(collectAssigned([financeira])).toEqual([])
  })

  it('builds a save payload without internal keys', () => {
    const payload = toSavePayload(cloneTree(salaryAdvancePermissionTree))
    const root = payload[0]

    expect(root?.uuid).toBe('6e2970c2-8f5b-431f-a101-63f58767f55a')
    expect(root?.assigned).toBeUndefined()
    expect(root?.key).toBeUndefined()
    expect(JSON.parse(JSON.stringify(payload))[0].description).toBe('Antecipação Salarial')

    const listar = root?.children[0]?.children[0]
    expect(listar?.assigned).toBe(true)
    expect(listar?.isCritial).toBe(false)
    expect(listar?.isVisible).toBe(false)
    expect(listar?.isDefault).toBe(false)
    expect(listar?.key).toBeUndefined()
  })
})
