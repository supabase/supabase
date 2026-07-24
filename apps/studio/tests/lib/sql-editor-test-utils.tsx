import { untrustedSql } from '@supabase/pg-meta'
import type { QueryClient } from '@tanstack/react-query'
import { renderHook, type RenderHookOptions } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'

import type {
  ContentDiff,
  DiffController,
  EditorController,
} from '@/components/interfaces/SQLEditor/SQLEditor.types'
import {
  computeErrorHighlightLine,
  createSqlSnippetSkeletonV2,
} from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { SQLEditorProvider } from '@/components/interfaces/SQLEditor/SQLEditorContext'
import { API_URL, OPT_IN_TAGS } from '@/lib/constants'
import type { ProfileContextType } from '@/lib/profile'
import { AiAssistantStateContext, createAiAssistantState } from '@/state/ai-assistant-state'
import {
  createDatabaseSelectorState,
  DatabaseSelectorStateContext,
} from '@/state/database-selector'
import {
  createRoleImpersonationState,
  RoleImpersonationStateContext,
} from '@/state/role-impersonation-state'
import { sidebarManagerState } from '@/state/sidebar-manager-state'
import { sqlEditorDiffRequestState } from '@/state/sql-editor/sql-editor-diff-request'
import { sqlEditorSessionState } from '@/state/sql-editor/sql-editor-session-state'
import { sqlEditorState } from '@/state/sql-editor/sql-editor-state'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

export type InMemoryEditor = {
  editor: EditorController
  diff: DiffController
  setValue: (value: string) => void
  setSelection: (value: string | undefined, startLineNumber?: number) => void
  getHighlightedLine: () => number | undefined
  getRevealedLine: () => number | undefined
  getDiffOriginal: () => string
  getDiffModified: () => string
  getDiffRevealedLine: () => number | undefined
  setDiffMounted: (mounted: boolean) => void
}

export function createInMemoryEditor(initialValue: string = ''): InMemoryEditor {
  let value = initialValue
  let selectionValue: string | undefined
  let selectionStartLine: number | undefined
  let highlightedLine: number | undefined
  let revealedLine: number | undefined

  let diffMounted = true
  let diffOriginal = ''
  let diffModified = ''
  let diffRevealedLine: number | undefined

  const editor: EditorController = {
    isReady: () => true,
    getValue: () => value,
    getSelectionStartLine: () => selectionStartLine,
    getSql: (snippetContent) => untrustedSql(selectionValue || value || snippetContent || ''),
    replaceAll: (text) => {
      value = text
    },
    focus: () => {},
    revealLineInCenter: (line) => {
      revealedLine = line
    },
    highlightErrorLine: (error, hasSelection) => {
      const startLineNumber = hasSelection ? (selectionStartLine ?? 0) : 0
      const line = computeErrorHighlightLine(error, startLineNumber)
      if (Number.isNaN(line)) return
      highlightedLine = line
      revealedLine = line
    },
    clearHighlights: () => {
      highlightedLine = undefined
    },
  }

  const diff: DiffController = {
    isMounted: () => diffMounted,
    getModifiedValue: () => diffModified,
    setDiff: (contentDiff: ContentDiff, revealLine: number) => {
      diffOriginal = contentDiff.original
      diffModified = contentDiff.modified
      diffRevealedLine = revealLine
    },
    attach: () => {
      diffMounted = true
    },
  }

  return {
    editor,
    diff,
    setValue: (v) => {
      value = v
    },
    setSelection: (v, startLine = 1) => {
      selectionValue = v
      selectionStartLine = v === undefined ? undefined : startLine
    },
    getHighlightedLine: () => highlightedLine,
    getRevealedLine: () => revealedLine,
    getDiffOriginal: () => diffOriginal,
    getDiffModified: () => diffModified,
    getDiffRevealedLine: () => diffRevealedLine,
    setDiffMounted: (mounted) => {
      diffMounted = mounted
    },
  }
}

/** Call in `beforeEach` for full isolation between SQL editor hook tests. */
export function resetSqlEditorStores() {
  for (const key of Object.keys(sqlEditorState.snippets)) {
    delete sqlEditorState.snippets[key]
  }
  for (const key of Object.keys(sqlEditorState.folders)) {
    delete sqlEditorState.folders[key]
  }
  sqlEditorState.needsSaving.clear()
  sqlEditorState.pendingFolderSaves.clear()

  for (const key of Object.keys(sqlEditorSessionState.results)) {
    delete sqlEditorSessionState.results[key]
  }
  sqlEditorSessionState.limit = 100

  sqlEditorDiffRequestState.pending = undefined

  sidebarManagerState.sidebars = {}
  sidebarManagerState.activeSidebar = undefined
  sidebarManagerState.pendingSidebarOpen = undefined
  sidebarManagerState.isMaximised = false
}

export function seedSnippet({
  id,
  projectRef = 'default',
  name = 'Test query',
  sql = '',
  ownerId = 1,
  projectId = 1,
}: {
  id: string
  projectRef?: string
  name?: string
  sql?: string
  ownerId?: number
  projectId?: number
}) {
  const snippet = createSqlSnippetSkeletonV2({
    name,
    sql,
    owner_id: ownerId,
    project_id: projectId,
    idOverride: id,
  })
  sqlEditorState.addSnippet({ projectRef, snippet })
  return snippet
}

export function setupSqlEditorMocks({
  ref = 'default',
  connectionString = 'postgresql://postgres@localhost:5432/postgres',
  orgId = 1,
  orgSlug = 'test-org',
  optInTags = [OPT_IN_TAGS.AI_SQL],
  queryRows = [] as unknown[],
}: {
  ref?: string
  connectionString?: string
  orgId?: number
  orgSlug?: string
  optInTags?: string[]
  queryRows?: unknown[]
} = {}) {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      id: 1,
      ref,
      organization_id: orgId,
      name: 'Test Project',
      status: 'ACTIVE_HEALTHY',
      cloud_provider: 'AWS',
      region: 'us-east-1',
      db_host: `db.${ref}.supabase.co`,
      restUrl: `https://${ref}.supabase.co/rest/v1/`,
      inserted_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      subscription_id: 'sub_123',
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      high_availability: false,
      integration_source: null,
      connectionString,
      is_hibernating: false,
    },
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: [
      {
        id: orgId,
        slug: orgSlug,
        name: 'Test Org',
        billing_email: 'test@supabase.io',
        billing_partner: null,
        integration_source: null,
        is_owner: true,
        opt_in_tags: optInTags,
        organization_missing_address: false,
        organization_missing_tax_id: false,
        organization_requires_mfa: false,
        plan: { id: 'free', name: 'Free' },
        restriction_data: null,
        restriction_status: null,
        stripe_customer_id: null,
        subscription_id: null,
        usage_billing_enabled: false,
      },
    ],
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/billing/subscription',
    response: {
      addons: [],
      billing_cycle_anchor: 1700000000,
      billing_via_partner: false,
      current_period_end: 1700000000,
      current_period_start: 1700000000,
      next_invoice_at: 1700000000,
      payment_method_type: 'card',
      plan: { id: 'free', name: 'Free' },
      project_addons: [],
      scheduled_plan_change: null,
      usage_billing_enabled: false,
    },
  })

  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: {
      cloud_provider: 'AWS',
      db_dns_name: `db.${ref}.supabase.co`,
      db_host: `db.${ref}.supabase.co`,
      db_ip_addr_config: 'ipv4',
      db_name: 'postgres',
      db_port: 5432,
      db_user: 'postgres',
      inserted_at: '2024-01-01T00:00:00Z',
      name: 'Test Project',
      ref,
      region: 'us-east-1',
      ssl_enforced: false,
      status: 'ACTIVE_HEALTHY',
    },
  })

  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/databases',
    response: [
      {
        identifier: ref,
        connectionString,
        cloud_provider: 'AWS',
        db_host: `db.${ref}.supabase.co`,
        db_name: 'postgres',
        db_port: 5432,
        db_user: 'postgres',
        inserted_at: '2024-01-01T00:00:00Z',
        region: 'us-east-1',
        restUrl: `https://${ref}.supabase.co/rest/v1/`,
        size: 'ci_micro',
        status: 'ACTIVE_HEALTHY',
      },
    ],
  })

  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json(queryRows),
  })

  // Internal Next API routes (not part of the platform OpenAPI spec), hit via
  // raw fetch — same MSW server, just registered directly rather than through
  // the typed `addAPIMock` helper.
  mswServer.use(
    http.post(`${API_URL}/ai/sql/title-v2`, async () =>
      HttpResponse.json({ title: 'Generated title', description: '' })
    ),
    http.post(`${API_URL}/ai/code/complete`, async () => HttpResponse.json('select 1;'))
  )
}

type NuqsAdapterProps = Partial<Parameters<typeof NuqsTestingAdapter>[0]>

type RenderSqlEditorHookOptions<TProps> = {
  initialProps?: TProps
  queryClient?: QueryClient
  nuqs?: NuqsAdapterProps
  profileContext?: ProfileContextType
  inMemoryEditor?: InMemoryEditor
  aiAssistantState?: ReturnType<typeof createAiAssistantState>
  databaseSelectorState?: ReturnType<typeof createDatabaseSelectorState>
  roleImpersonationState?: ReturnType<typeof createRoleImpersonationState>
}

export function renderSqlEditorHook<TResult, TProps = undefined>(
  hook: (props: TProps) => TResult,
  options?: RenderSqlEditorHookOptions<TProps>
) {
  const inMemoryEditor = options?.inMemoryEditor ?? createInMemoryEditor()
  const aiAssistantState = options?.aiAssistantState ?? createAiAssistantState()
  const databaseSelectorState = options?.databaseSelectorState ?? createDatabaseSelectorState()
  const roleImpersonationState =
    options?.roleImpersonationState ??
    createRoleImpersonationState('default', { current: async () => ({}) })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <CustomWrapper
      queryClient={options?.queryClient}
      nuqs={options?.nuqs}
      profileContext={options?.profileContext}
    >
      <RoleImpersonationStateContext.Provider value={roleImpersonationState}>
        <DatabaseSelectorStateContext.Provider value={databaseSelectorState}>
          <AiAssistantStateContext.Provider value={aiAssistantState}>
            <SQLEditorProvider editor={inMemoryEditor.editor} diff={inMemoryEditor.diff}>
              {children}
            </SQLEditorProvider>
          </AiAssistantStateContext.Provider>
        </DatabaseSelectorStateContext.Provider>
      </RoleImpersonationStateContext.Provider>
    </CustomWrapper>
  )

  const result = renderHook(hook, {
    initialProps: options?.initialProps,
    wrapper,
  } as RenderHookOptions<TProps>)

  return {
    ...result,
    inMemoryEditor,
    aiAssistantState,
    databaseSelectorState,
    roleImpersonationState,
  }
}
