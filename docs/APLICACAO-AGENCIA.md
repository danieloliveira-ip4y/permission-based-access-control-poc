# Aplicação da PoC na Agência (agencia-front)

Documento de encaixe: o que replicar da PoC de permission-based access control no front da Agência, o que não replicar, e **como substituir o Route Guard** sem `vue-router`.

Escopo atual: **somente módulos Vue novos** (formato 4 camadas). Módulos legados (Blade/jQuery, `domain/model` + `gateways`, dual-list de permissão) ficam de fora por enquanto.

Regra de ouro (PoC e harness da Agência):

> O microserviço autoriza. O front **projeta** UX (`can` / `v-can`). Esconder botão não é defesa.

---

## 1. Contexto rápido

| | PoC | Agência |
|---|---|---|
| Shell | SPA Vue + `vue-router` | Blade + um `createApp` em `#app` |
| Sessão | Auth Store mock | Sessão Laravel + proxy |
| Autorização | Mock + ideia de Gates no Laravel | Microserviço (`ENDPOINT_TO_BACK`) |
| Navegação | Rotas client-side + `beforeEach` | Rotas Laravel → blade → tag Vue |
| Admin de permissão | Árvore Vue | Dual-list jQuery (legado; fora do escopo) + **PoC Vue** `ManagePermissionsModal` em `/matriz/poc-permissoes` |
| Módulo novo | N/A | Rule `12-new-module-layers.md` |

### Status da PoC na Agência (revisão — 2ª passagem)

| Item do plano | Status | Onde / evidência |
|---|---|---|
| `PermissionService` / Store / `v-can` / boot load | **Feito** | `modules/permissions/` + `app.directive('can')` + load no boot |
| `usePermission` / `PermissionPage` / `usePagePermissionGuard` | **Feito no núcleo; não consumido na landing** | APIs exportadas; `Dashboard.vue` só usa store + `v-can` |
| Catálogo tipado `PERMISSIONS` | **Feito (PoC)** | Só `poc.permissions.*` — não espelha catálogo de produto |
| Módulo Vue 4 camadas | **Parcial** | Scaffold `DemoResource*` + use case existe, **mas a landing não usa**; UX real = modal de catálogo |
| Rota + blade + menu | **Feito** | `/matriz/poc-permissoes` |
| Tela admin em árvore (UX) | **Feito (PoC)** | `ManagePermissionsModal` + `CatalogTreeNode` + `permissionTree.ts` |
| Shape do nó vs contrato PoC | **Parcial** | Agência: `uuid`, `description`, `assigned?`, `children`. **Faltam** `key`, `isCritial`, `isVisible`, `isDefault` |
| Page Guard na landing | **Não ligado** | Sem `PermissionPage` / `usePagePermissionGuard` na page |
| `permission.client` → microserviço | **Não** | Ainda `fetchMockCurrentUserPermissions` (+ personas mock `full`/`limited`/`none`) |
| Gateway/proxy do catálogo (list/save) | **Não** | Save do modal é local (`emit` + `showMessage` mock) |
| Proxy `/api/permission*` existente | **Outro domínio** | Rotas Laravel de permission existem, mas **não** alimentam o Store de chaves do usuário logado |
| Menu Blade filtrado | **Não** (fase posterior) | — |

Observações (código × doc):

1. Tree utils estão em `permissionPoc/.../utils/permissionTree.ts`, não em `permissions/` — ok para PoC; promover se for produto (§2 ainda descreve o *alvo*).
2. Mock do catálogo está **triplicado** (24 grupos) só para scroll; não é contrato de produção.
3. Scaffold `ListDemoResources*` ficou órfão da UX atual — candidata a limpeza ou a religar num demo de Page Guard.
4. Personas no mock de permissão **não** são Auth Store; só alternam o conjunto de chaves no client mock.
5. Regra de ouro permanece válida: front projeta; microserviço autoriza.

---

## 2. O que podemos aplicar

Escopo: núcleo compartilhado + consumo em **módulos Vue novos**.

| Peça da PoC | Aplicar? | Onde na Agência | Papel |
|---|---|---|---|
| `PermissionService` (`can` / `canAny` / `canAll` / `check`) | **Sim** | `resources/js/modules/permissions/` (ou `common/`) | Avaliador puro, sem Vue |
| `PermissionStore` (Pinia) | **Sim** | Mesmo módulo; Pinia já é global no `app.js` | Guarda chaves da sessão |
| `permission.client` / gateway | **Sim** | Gateway 4 camadas + rota `/api` no proxy | Único seam HTTP |
| Catálogo tipado `PERMISSIONS` (`recurso.acao`) | **Sim*** | `catalog/permissions.ts` | Tipagem; evita typo no `v-can` |
| `usePermission()` | **Sim** | Hook do módulo; pages novas importam | Consulta na lógica da tela |
| Diretiva `v-can` | **Sim** | `app.directive` no `app.js` | Esconde ação/seção no template |
| Tree Service (clone, cascade, payload) | **Sim, se houver tela admin nova** | *Hoje:* `permissionPoc/.../permissionTree.ts`. *Alvo:* `modules/permissions/` | Matemática da árvore |
| `PermissionTree` UI | **Sim, se houver tela admin nova** | *Hoje:* `ManagePermissionsModal` (PoC). *Alvo:* page/admin de produto | Atribuição em Vue (não híbrido) |
| Logger de permissão (opcional) | **Sim, opcional** | Alinhar a `logger` da Agência | Trace de load / deny |

\* Catálogo tipado só é sólido se o microserviço devolver **chave estável** (`key` / `recurso.acao`) ou `uuid` mapeável. Sem isso, não inventar chave local a partir de `description`.

### Fluxo alvo em módulo novo

```text
Login Laravel (já existe)
  → boot Vue (app.js)
  → permission.client busca chaves do usuário logado
  → PermissionStore carrega
  → page nova: usePagePermissionGuard + v-can / usePermission
  → gateway chama API → microserviço autoriza de verdade
```

### Pré-requisito de contrato (back)

Para o núcleo ligar de verdade:

1. Endpoint das permissões do **usuário logado** (lista de chaves ou árvore com `assigned`).
2. Preferência de shape alinhada à PoC: `uuid`, `description`, `assigned?`, `isCritial?`, `isVisible?`, `isDefault?`, `children`, e `key` estável para o front.

Proxy Laravel só encaminha. Já existem rotas `/api/permission*` na Agência para **outros** fluxos de permissão; o Store PBAC ainda **não** consome nenhuma delas — o seam a ligar é `permission.client` → endpoint de chaves do usuário logado. Controller sem regra de negócio.

---

## 3. O que não podemos aplicar (agora)

| Peça da PoC | Por que não |
|---|---|
| **Route Guard do `vue-router`** (`beforeEach` + `meta.permissions`) | Agência não usa `vue-router`. Navegação é Laravel → Blade. Ver §4. |
| **Auth Store / login Vue / personas** | Sessão e contexto (matriz/PJ/PF) já são Laravel. Não duplicar identidade no Pinia. |
| **`PermissionDebugger`** | Ferramenta de PoC; não é produto. |
| **`RouteMeta.permissions`** | Não existe rota client-side para anotar. |
| **Enforce / Policy no front** | Harness: autorização no microserviço. Front não inventa permissão local. |
| **Plugar em módulos antigos** | Fora do escopo atual (salaryAdvance legado, voucher, Blade/DataTables, dual-list). |
| **Híbrido Vue na dual-list jQuery** | Rule `11-follow-the-screen.md`: não misturar. Admin novo = tela Vue inteira. |
| **Substituir menu Blade de uma vez** | Sidebar é layout estático por contexto. Filtrar menu é fase posterior, não bloqueia o núcleo. |

---

## 4. Solução proposta no lugar do Route Guard

### 4.1 O problema

Na PoC o Guard roda **antes** da página montar:

```text
navegação → beforeEach → evaluateRouteAccess(meta.permissions) → allow | /403 | /login
```

Na Agência não há `beforeEach`. A URL já resolveu no Laravel e a blade já montou a tag Vue. Precisamos do mesmo *efeito* (bloquear a tela sem a chave) com outras alavancas.

### 4.2 Três camadas (substituto do Guard)

| Camada | Quem | Quando | O que faz |
|---|---|---|---|
| **A — Rota Laravel** | Middleware (`CheckLogin`, `CheckConta*`, e opcionalmente checagem de permissão no proxy/back) | Antes do HTML | Garante sessão + contexto de conta. Continua sendo a porta da URL. |
| **B — Page Guard Vue** | Composable `usePagePermissionGuard` na **page** do módulo novo | No `setup` / antes de buscar dados | Se faltar chave → não renderiza a feature; redireciona ou mostra 403. **Este é o análogo do Guard da PoC.** |
| **C — UI** | `v-can` / `usePermission` | No template | Esconde botões e seções. Só UX. |

A defesa continua sendo a **API** (403). A + B + C são projeção e UX.

```text
URL /matriz/.../nova-feature
  → Laravel middleware (A)        # sessão + contexto
  → Blade monta <nova-feature />
  → app.js já carregou PermissionStore
  → page chama usePagePermissionGuard (B)
        ├─ allowed → hook/gateway seguem
        └─ denied  → redirect / página de acesso negado
  → botões com v-can (C)
```

### 4.3 Page Guard — contrato sugerido

Composable puro em cima do mesmo `PermissionService` da PoC (sem depender de router):

```ts
// Ideia — infrastructure/presentation/hooks/usePagePermissionGuard.ts
// (ou no módulo permissions compartilhado)

type PagePermissionGuardOptions = {
  permissions: Permission[]   // chaves exigidas pela página
  mode?: 'all' | 'any'        // default: 'all'
  /**
   * 'redirect' → window.location / rota Laravel de acesso negado
   * 'block'    → não redireciona; a page só exibe estado blocked
   */
  denyMode?: 'redirect' | 'block'
}

type PagePermissionGuardResult = {
  isAllowed: Ref<boolean>
  isReady: Ref<boolean>       // store já carregou
  missing: Ref<Permission[]>
}
```

Comportamento:

1. Garante que o `PermissionStore` está `isLoaded` (senão `await loadPermissions()`).
2. Avalia com `PermissionService.check(permissions, mode)` — **a mesma função** que a PoC usa no Guard.
3. Se negar e `denyMode === 'redirect'`: navega para a rota Laravel de acesso negado (ex. página 403 / home do contexto). Sem `vue-router`: `window.location.assign(...)` ou form POST logout, conforme o padrão já usado no interceptor 401/403.
4. Se `denyMode === 'block'`: `isAllowed = false` e a page renderiza um estado “sem permissão” (componente simples), sem chamar gateways.

Uso na page nova (4 camadas):

```vue
<script setup lang="ts">
const { isAllowed, isReady } = usePagePermissionGuard({
  permissions: ['financeiras.list'],
  mode: 'all',
  denyMode: 'redirect',
})
// hooks de dados só disparam quando isAllowed && isReady
</script>

<template>
  <div v-if="isReady && isAllowed">
    <!-- conteúdo da feature -->
  </div>
</template>
```

Opcional — wrapper declarativo (equivalente leve ao `meta.permissions`):

```vue
<!-- PermissionPage.vue -->
<permission-page :permissions="['financeiras.list']" mode="all" deny-mode="block">
  <financial-registration />
</permission-page>
```

Implementação de referência na Agência: módulo `resources/js/modules/permissions/` + tela PoC em `resources/js/modules/permissionPoc/` (`/matriz/poc-permissoes`).

Por dentro, o wrapper só chama `usePagePermissionGuard`. A page filha não precisa repetir o boilerplate.

### 4.4 O que permanece igual à PoC

| Na PoC (Guard) | Na Agência (Page Guard) |
|---|---|
| `PermissionService.check` | **Igual** |
| Lê chaves do Store | **Igual** |
| `mode: 'all' \| 'any'` | **Igual** |
| Negado → `/403` | Negado → rota Laravel de acesso negado **ou** bloco na page |
| Roda no `beforeEach` | Roda no `setup` da page / wrapper |
| Declaração em `route.meta` | Declaração no composable / props do wrapper |

**Não reimplementar** a lógica de “pode ou não” em outro lugar. Service continua sendo o único avaliador.

### 4.5 O que o Page Guard *não* substitui

- **Colar a URL sem estar logado** → continua `CheckLogin`.
- **Abrir tela de outro contexto (PJ vs matriz)** → continua `CheckConta*`.
- **Chamar a API sem permissão** → continua 403 do microserviço.
- **Itens de menu Blade** → fase posterior (filtro no layout ou menu Vue); não faz parte do Guard.

### 4.6 Evolução opcional no Laravel (camada A reforçada)

Se no futuro a URL em si não puder abrir sem a chave (sem depender do Vue montar):

1. Middleware Laravel chama o microserviço (ou lê cache de sessão) com a chave exigida pela rota.
2. Sem permissão → redirect server-side antes do Blade.

Isso é complemento, não substituto do Page Guard: páginas Vue novas ainda usam (B) + (C) para ações internas. Começar só com (B)+(C) já entrega o valor da PoC sem mudar o Kernel.

---

## 5. Mapa “PoC → Agência” (resumo)

| Camada PoC | Na Agência | Status |
|---|---|---|
| Auth Store | Sessão Laravel | Não aplicar |
| Permission Store | Pinia global | **Feito** |
| Permission Service | Módulo compartilhado | **Feito** |
| permission.client | Gateway + proxy | **Feito (mock)** — falta HTTP real |
| Catálogo `PERMISSIONS` | Tipagem front | **Feito (chaves PoC)** — falta `key` no nó de árvore |
| `usePermission` | Hook | **Feito** — ainda sem uso nas pages |
| `v-can` | `app.directive` | **Feito** (usado na landing) |
| Route Guard | **Page Guard** + middleware Laravel | **Adaptado no núcleo** — landing ainda não consome |
| Tree Service / Tree UI | Tela admin Vue **nova** | **PoC UX feita** em `permissionPoc`; shape incompleta vs PoC; sem persistência |
| Debugger | — | Não aplicar (há só personas no mock do client) |

---

## 6. Ordem sugerida de adoção

1. **Contrato** no microserviço: chaves do usuário logado (+ árvore se admin Vue vier em seguida). ← pendente
2. **Núcleo** no front: Service, Store, client/gateway, `usePermission`, `v-can`, `usePagePermissionGuard`. ← **feito** (client mock)
3. **Primeiro módulo Vue novo** consome Page Guard + `v-can` (não plugar legado). ← **parcial** (`v-can` ok; Page Guard/hooks não ligados; scaffold DemoResource órfão)
4. **Tela admin em árvore** (opcional, tela nova completa). ← **PoC UX feita**; falta shape completo + gateway/proxy
5. **Menu Blade** filtrado (opcional, fase posterior). ← pendente

Próximos passos recomendados (código):

1. Envolver a landing PoC com `PermissionPage` / `usePagePermissionGuard` (`poc.permissions.view`).
2. Trocar `permission.client` mock por GET real via proxy quando o endpoint existir.
3. Alinhar `CatalogPermissionNode` ao contrato PoC (`key`, flags) e expor gateway list/save; reduzir mock triplicado.
4. Remover ou religar o scaffold `DemoResource*` à demo de Page Guard.
5. Se a árvore for produto: mover `permissionTree` (+ tipos) para `modules/permissions/`.

---

## 7. Referências

- PoC: `docs/ARQUITETURA.md`
- Agência: `.harness/rules/10-architecture.md`, `11-follow-the-screen.md`, `12-new-module-layers.md`, `15-http-proxy.md`
- Skill de tela nova: `.harness/skills/new-screen/SKILL.md`
- Implementação Agência: `resources/js/modules/permissions/`, `resources/js/modules/permissionPoc/`, rota `/matriz/poc-permissoes`
