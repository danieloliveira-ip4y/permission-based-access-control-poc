import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { canDirective } from '../directives/permission.directive'
import { usePermissionStore } from '../stores/permission.store'

const Probe = defineComponent({
  template: `
    <div>
      <button class="create" v-can="'users.create'">Criar</button>
      <button class="delete" v-can="'users.delete'">Excluir</button>
      <button
        class="manage"
        v-can="{ permissions: ['users.create', 'users.update'], mode: 'any' }"
      >
        Gerenciar
      </button>
    </div>
  `,
})

let wrapper: VueWrapper | null = null

function mountProbe() {
  const pinia = getActivePinia()
  if (!pinia) {
    throw new Error('Pinia is not active')
  }

  wrapper = mount(Probe, {
    attachTo: document.body,
    global: {
      plugins: [pinia],
      directives: {
        can: canDirective,
      },
    },
  })

  return wrapper
}

describe('v-can', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('keeps an authorized element in the DOM', async () => {
    const store = usePermissionStore()
    store.updatePermissions(['users.create'])

    const view = mountProbe()
    await nextTick()

    expect(view.find('.create').exists()).toBe(true)
    expect(view.find('.delete').exists()).toBe(false)
    expect(document.querySelector('.delete')).toBeNull()
  })

  it('removes unauthorized elements from the DOM', async () => {
    const store = usePermissionStore()
    store.updatePermissions(['reports.view'])

    const view = mountProbe()
    await nextTick()

    expect(view.find('.create').exists()).toBe(false)
    expect(view.find('.delete').exists()).toBe(false)
    expect(view.find('.manage').exists()).toBe(false)
    expect(document.querySelector('.create')).toBeNull()
    expect(document.querySelector('.delete')).toBeNull()
    expect(document.querySelector('.manage')).toBeNull()
  })

  it('restores and removes nodes after a profile-like permission change', async () => {
    const store = usePermissionStore()
    store.updatePermissions(['users.create', 'users.update'])

    const view = mountProbe()
    await nextTick()

    expect(view.find('.create').exists()).toBe(true)
    expect(view.find('.delete').exists()).toBe(false)
    expect(view.find('.manage').exists()).toBe(true)

    store.updatePermissions(['users.delete'])
    await nextTick()

    expect(view.find('.create').exists()).toBe(false)
    expect(view.find('.delete').exists()).toBe(true)
    expect(view.find('.manage').exists()).toBe(false)
    expect(document.querySelector('.create')).toBeNull()
    expect(document.querySelector('.delete')).not.toBeNull()
  })
})
