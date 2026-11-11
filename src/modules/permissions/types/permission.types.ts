import type { Permission } from '../catalog/permissions'

export type { Permission }
export { PERMISSIONS, isPermission, retainKnownPermissions } from '../catalog/permissions'

export type PermissionMode = 'all' | 'any'

export type UserProfile = 'admin' | 'operator' | 'viewer'

export interface PermissionsResponse {
  permissions: Permission[]
}

export interface PermissionCheckOptions {
  permissions: Permission[]
  mode?: PermissionMode
}

export type PermissionDirectiveValue = Permission | Permission[] | PermissionCheckOptions

/**
 * Tree node matching the Laravel catalog payload.
 * `assigned` exists only on grantable permissions. Nodes without it are groups.
 * `isCritial` / `isVisible` / `isDefault` mirror the backend flags (typo `isCritial` is intentional).
 * `key` is optional and used by the PoC (Proof of Concept) to bind a node to a frontend permission string.
 */
export interface PermissionNode {
  uuid: string
  description: string
  assigned?: boolean
  isCritial?: boolean
  isVisible?: boolean
  isDefault?: boolean
  children: PermissionNode[]
  key?: Permission
}

export type PermissionCheckState = 'checked' | 'unchecked' | 'indeterminate'
