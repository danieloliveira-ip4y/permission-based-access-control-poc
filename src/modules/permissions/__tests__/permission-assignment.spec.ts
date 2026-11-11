import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  buildDefaultPermissionTree,
  resetPermissionAssignments,
} from '@/mocks/permission-tree.mock'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { saveAssignedPermissions } from '../services/permission-assignment.service'
import { collectAssignedKeys, toggleNode } from '../services/permission-tree.service'
import { usePermissionStore } from '../stores/permission.store'

describe('saveAssignedPermissions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetPermissionAssignments()
  })

  it('updates the live store when the assigned user is the one logged in', async () => {
    const authStore = useAuthStore()
    const permissionStore = usePermissionStore()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })

    authStore.login('admin')
    await permissionStore.loadPermissions('admin')

    const tree = buildDefaultPermissionTree('admin')
    const analisar = tree[0]?.children.find(
      (node) => node.description === 'Analisar Antecipação (exemplo)',
    )
    if (!analisar) {
      throw new Error('Analisar Antecipação not found')
    }
    toggleNode(analisar)

    await saveAssignedPermissions(1, tree, router)

    expect(permissionStore.permissions).toEqual(collectAssignedKeys(tree))
    expect(permissionStore.permissions).not.toContain('antecipacao.analyze')
  })
})
