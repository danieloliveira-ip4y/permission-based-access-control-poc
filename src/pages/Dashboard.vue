<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { usePermissionStore } from '@/modules/permissions/stores/permission.store'
import { profileLabels } from '@/mocks/user.mock'

const authStore = useAuthStore()
const permissionStore = usePermissionStore()
const { user, currentProfile } = storeToRefs(authStore)
const { permissions, permissionCount } = storeToRefs(permissionStore)

const profileLabel = computed(() =>
  currentProfile.value ? profileLabels[currentProfile.value] : '—',
)
</script>

<template>
  <section class="page">
    <header class="page__header">
      <div>
        <p class="eyebrow">Início</p>
        <h1>Dashboard</h1>
      </div>
    </header>

    <div class="stat-grid">
      <article class="stat-card">
        <span>Usuário</span>
        <strong>{{ user?.name }}</strong>
        <p>{{ user?.email }}</p>
      </article>
      <article class="stat-card">
        <span>Perfil atual</span>
        <strong>{{ profileLabel }}</strong>
        <p>{{ currentProfile }}</p>
      </article>
      <article class="stat-card">
        <span>Permissões</span>
        <strong>{{ permissionCount }}</strong>
        <p>carregadas do mock</p>
      </article>
    </div>

    <article class="panel">
      <h2>Permissões disponíveis</h2>
      <ul class="chip-list">
        <li v-for="permission in permissions" :key="permission" class="chip">{{ permission }}</li>
      </ul>
    </article>

    <article class="panel">
      <h2>Ações — Antecipação Salarial</h2>
      <p class="muted">
        Estas ações usam as chaves da árvore de Antecipação. Marque-as em Permissões, salve para o
        usuário logado e elas aparecem aqui na hora.
      </p>
      <div class="page__actions page__actions--after">
        <button v-can="'financeiras.list'" type="button" class="btn btn--secondary">
          Listar financeiras
        </button>
        <button v-can="'financeiras.create'" type="button" class="btn btn--primary">
          Adicionar financeira
        </button>
        <button v-can="'financeiras.search'" type="button" class="btn btn--secondary">
          Procurar financeira
        </button>
        <button v-can="'modalidades.list'" type="button" class="btn btn--secondary">
          Listar modalidades
        </button>
        <button v-can="'antecipacao.analyze'" type="button" class="btn btn--secondary">
          Analisar antecipação
        </button>
      </div>
    </article>
  </section>
</template>
