import { describe, expect, it } from 'vitest'
import { permissionCatalog } from '@/mocks/permission-tree.mock'
import { PERMISSIONS, isPermission, retainKnownPermissions } from '../catalog/permissions'
import { collectAssignable, nodePermissionKey } from '../services/permission-tree.service'

describe('permission catalog', () => {
  it('exposes a key for every grantable node in the tree', () => {
    const fromTree = collectAssignable(permissionCatalog).map(nodePermissionKey)

    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length)
    for (const key of fromTree) {
      expect(PERMISSIONS).toContain(key)
    }
  })

  it('keeps only known permission strings', () => {
    expect(isPermission('users.view')).toBe(true)
    expect(isPermission('financeiras.list')).toBe(true)
    expect(isPermission('users.veiw')).toBe(false)
    expect(
      retainKnownPermissions(['users.view', 'users.veiw', 'financeiras.list', 'pix.approve']),
    ).toEqual(['users.view', 'financeiras.list'])
  })
})
