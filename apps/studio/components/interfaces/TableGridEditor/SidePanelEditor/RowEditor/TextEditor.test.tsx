import { MAX_CHARACTERS } from '@supabase/pg-meta/src/query/table-row-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TextEditor } from './TextEditor'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import {
  createRoleImpersonationState,
  RoleImpersonationStateContext,
} from '@/state/role-impersonation-state'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// The table editor reads the table id off the URL params
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default', id: '1' }),
    useFlag: () => false,
  }
})

// CodeEditor wraps Monaco, which can't mount in jsdom
vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}))

mockAnimationsApi()

// A value that isValueTruncated() recognizes as truncated (ends with "..." and
// is longer than MAX_CHARACTERS), so the "Load full text data" button renders.
const TRUNCATED_VALUE = 'a'.repeat(MAX_CHARACTERS + 1) + '...'
const FULL_VALUE = 'the full untruncated value'

const tableEntity = {
  entity_type: ENTITY_TYPE.TABLE,
  id: 1,
  schema: 'public',
  name: 'profiles',
  primary_keys: [{ name: 'id' }],
  columns: [{ name: 'description', format: 'text' }],
}

describe('RowEditor TextEditor - load full truncated value', () => {
  let cellValueQueries: string[] = []

  beforeEach(() => {
    cellValueQueries = []

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project is enough for useSelectedProjectQuery
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })

    // Both the table-editor introspection and getCellValue hit this endpoint.
    // The cell-value query is the one that selects from the user table
    // ("public"."profiles"); the introspection query filters pg_catalog by id.
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const body = (await request.json()) as { query: string }
        const query = body.query

        if (query.includes('profiles')) {
          cellValueQueries.push(query)
          return HttpResponse.json([{ description: FULL_VALUE }])
        }
        // table-editor introspection
        return HttpResponse.json([{ entity: tableEntity }])
      },
    })
  })

  it('wraps the getCellValue SQL with the impersonated role when View as role is active', async () => {
    const roleImpersonationState = createRoleImpersonationState('default', {
      current: async () => {},
    })
    roleImpersonationState.role = { type: 'custom', role: 'test_role' }

    customRender(
      <RoleImpersonationStateContext.Provider value={roleImpersonationState}>
        <TextEditor
          visible
          row={{ id: 1, description: TRUNCATED_VALUE }}
          column="description"
          closePanel={() => {}}
          onSaveField={() => {}}
        />
      </RoleImpersonationStateContext.Provider>
    )

    const loadButton = await screen.findByRole('button', { name: 'Load full text data' })

    // Retry the click: it no-ops until the table-editor introspection resolves
    // and populates selectedTable. Every captured query is role-impersonated,
    // so extra clicks (if any) don't affect the assertion.
    await waitFor(() => {
      fireEvent.click(loadButton)
      expect(cellValueQueries.length).toBeGreaterThan(0)
    })

    expect(cellValueQueries[0]).toContain("set local role 'test_role'")
  })

  it('does not impersonate a role when View as role is inactive', async () => {
    const roleImpersonationState = createRoleImpersonationState('default', {
      current: async () => {},
    })
    // role stays undefined -> runs as the default (postgres) role

    customRender(
      <RoleImpersonationStateContext.Provider value={roleImpersonationState}>
        <TextEditor
          visible
          row={{ id: 1, description: TRUNCATED_VALUE }}
          column="description"
          closePanel={() => {}}
          onSaveField={() => {}}
        />
      </RoleImpersonationStateContext.Provider>
    )

    const loadButton = await screen.findByRole('button', { name: 'Load full text data' })

    await waitFor(() => {
      fireEvent.click(loadButton)
      expect(cellValueQueries.length).toBeGreaterThan(0)
    })

    expect(cellValueQueries[0]).not.toContain('set local role')
  })
})
