/**
 * Canonical frontend permission keys (`resource.action`).
 * Route meta, v-can, usePermission and the tree `key` field must use these literals.
 */
export const PERMISSIONS = [
  'dashboard.view',
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
  'reports.view',
  'reports.export',
  'settings.view',
  'settings.update',
  'permissions.manage',
  'financeiras.list',
  'financeiras.create',
  'financeiras.commission.update',
  'financeiras.account.movement.set',
  'financeiras.account.disbursement.set',
  'financeiras.limits.auto.set',
  'financeiras.search',
  'modalidades.list',
  'antecipacao.analyze',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSIONS)

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value)
}

export function retainKnownPermissions(values: readonly string[]): Permission[] {
  return values.filter(isPermission)
}
