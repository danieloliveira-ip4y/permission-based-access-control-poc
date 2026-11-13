import { watch, type Directive, type WatchStopHandle } from 'vue'
import { storeToRefs } from 'pinia'
import { createPermissionService } from '../services/permission.service'
import { usePermissionStore } from '../stores/permission.store'
import type {
  Permission,
  PermissionDirectiveValue,
  PermissionMode,
} from '../types/permission.types'

interface DirectiveState {
  stop: WatchStopHandle
  value: PermissionDirectiveValue
  placeholder: Comment
}

const stateByElement = new WeakMap<HTMLElement, DirectiveState>()

function normalizeBinding(value: PermissionDirectiveValue): {
  permissions: Permission[]
  mode: PermissionMode
} {
  if (typeof value === 'string') {
    return { permissions: [value], mode: 'all' }
  }

  if (Array.isArray(value)) {
    return { permissions: value, mode: 'all' }
  }

  return {
    permissions: value.permissions,
    mode: value.mode ?? 'all',
  }
}

function isAllowed(value: PermissionDirectiveValue): boolean {
  const permissionStore = usePermissionStore()
  const { permissions, mode } = normalizeBinding(value)
  return createPermissionService(permissionStore.permissions).check(permissions, mode)
}

function syncElementPresence(el: HTMLElement, value: PermissionDirectiveValue): void {
  const state = stateByElement.get(el)
  if (!state) {
    return
  }

  const { placeholder } = state
  const allowed = isAllowed(value)

  if (allowed) {
    if (!el.isConnected && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(el, placeholder)
      placeholder.remove()
    }
    return
  }

  if (el.parentNode) {
    el.parentNode.insertBefore(placeholder, el)
    el.remove()
  }
}

export const canDirective: Directive<HTMLElement, PermissionDirectiveValue> = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const { permissions } = storeToRefs(permissionStore)

    const stop = watch(
      permissions,
      () => {
        const current = stateByElement.get(el)
        if (!current) {
          return
        }
        syncElementPresence(el, current.value)
      },
      { deep: true },
    )

    stateByElement.set(el, {
      stop,
      value: binding.value,
      placeholder: document.createComment('v-can'),
    })
    syncElementPresence(el, binding.value)
  },

  updated(el, binding) {
    const current = stateByElement.get(el)
    if (current) {
      current.value = binding.value
    }
    syncElementPresence(el, binding.value)
  },

  unmounted(el) {
    const current = stateByElement.get(el)
    current?.stop()
    current?.placeholder.remove()
    stateByElement.delete(el)
  },
}
