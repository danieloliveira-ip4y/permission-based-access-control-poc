import { mockUsersByProfile } from '@/mocks/user.mock'
import {
  applyGrantedKeys,
  cloneTree,
  collectAssignedKeys,
} from '@/modules/permissions/services/permission-tree.service'
import type {
  PermissionNode,
  PermissionsResponse,
  UserProfile,
} from '@/modules/permissions/types/permission.types'
import { permissionsByProfile } from './permissions.mock'

/**
 * Catálogo mock alinhado ao contrato Laravel (uuid + flags).
 * `key` é só da PoC para amarrar o nó à string do frontend.
 */
export const salaryAdvancePermissionTree: PermissionNode[] = [
  {
    uuid: '6e2970c2-8f5b-431f-a101-63f58767f55a',
    description: 'Antecipação Salarial',
    children: [
      {
        uuid: '6e2970c2-8f5b-431f-a101-63f58767f51a',
        description: 'Financeira',
        children: [
          {
            uuid: '6e2970c2-8f5b-431f-a101-63f58767f52a',
            description: 'Listar Financeiras',
            assigned: true,
            isCritial: false,
            isVisible: false,
            isDefault: false,
            key: 'financeiras.list',
            children: [
              {
                uuid: '6e2970c2-8f5b-431f-a101-63f58767f53a',
                description: 'Adicionar Financeiras',
                assigned: true,
                isCritial: false,
                isVisible: false,
                isDefault: false,
                key: 'financeiras.create',
                children: [],
              },
              {
                uuid: '6e2970c2-8f5b-431f-a101-63f58767f54a',
                description: 'Atualizar Comissão',
                assigned: true,
                isCritial: false,
                isVisible: false,
                isDefault: false,
                key: 'financeiras.commission.update',
                children: [],
              },
              {
                uuid: '6e2970c2-8f5b-431f-a101-63f58767f56a',
                description: 'Definir Conta Movimento',
                assigned: true,
                isCritial: false,
                isVisible: false,
                isDefault: false,
                key: 'financeiras.account.movement.set',
                children: [],
              },
              {
                uuid: '6e2970c2-8f5b-431f-a101-63f58767f57a',
                description: 'Definir Conta Desembolso',
                assigned: true,
                isCritial: false,
                isVisible: false,
                isDefault: false,
                key: 'financeiras.account.disbursement.set',
                children: [],
              },
              {
                uuid: '6e2970c2-8f5b-431f-a101-63f58767f58a',
                description: 'Definir Limites Automáticos',
                assigned: true,
                isCritial: false,
                isVisible: false,
                isDefault: false,
                key: 'financeiras.limits.auto.set',
                children: [],
              },
            ],
          },
          {
            uuid: '6e2970c2-8f5b-431f-a101-63f58767f59a',
            description: 'Procurar Financeira',
            assigned: true,
            isCritial: false,
            isVisible: false,
            isDefault: false,
            key: 'financeiras.search',
            children: [],
          },
          {
            uuid: '6e2970c2-8f5b-431f-a101-63f58767f5aa',
            description: 'Listar Modalidade',
            assigned: true,
            isCritial: false,
            isVisible: false,
            isDefault: false,
            key: 'modalidades.list',
            children: [],
          },
        ],
      },
      {
        uuid: '6e2970c2-8f5b-431f-a101-63f58767f5ba',
        description: 'Analisar Antecipação (exemplo)',
        assigned: true,
        isCritial: false,
        isVisible: false,
        isDefault: false,
        key: 'antecipacao.analyze',
        children: [],
      },
    ],
  },
]

export const permissionCatalog: PermissionNode[] = cloneTree(salaryAdvancePermissionTree)

const assignmentsByUserId = new Map<number, PermissionNode[]>()

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function mockLatency(): number {
  return import.meta.env.MODE === 'test' ? 0 : 160
}

export function buildDefaultPermissionTree(profile: UserProfile): PermissionNode[] {
  const tree = cloneTree(permissionCatalog)
  const granted = new Set(permissionsByProfile[profile] ?? [])
  applyGrantedKeys(tree, granted)
  return tree
}

export function getUserPermissionTree(userId: number, profile: UserProfile): PermissionNode[] {
  const stored = assignmentsByUserId.get(userId)
  if (stored) {
    return cloneTree(stored)
  }

  return buildDefaultPermissionTree(profile)
}

export async function fetchUserPermissionTree(
  userId: number,
  profile: UserProfile,
): Promise<PermissionNode[]> {
  await wait(mockLatency())
  return getUserPermissionTree(userId, profile)
}

export async function persistUserPermissionTree(
  userId: number,
  tree: PermissionNode[],
): Promise<PermissionsResponse> {
  await wait(mockLatency())
  const stored = cloneTree(tree)
  assignmentsByUserId.set(userId, stored)
  return { permissions: collectAssignedKeys(stored) }
}

export function resetPermissionAssignments(): void {
  assignmentsByUserId.clear()
}

export function profileUserId(profile: UserProfile): number {
  return mockUsersByProfile[profile]?.id ?? 0
}
