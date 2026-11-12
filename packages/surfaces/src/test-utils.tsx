import type { Capabilities, DataPort, Project, Table } from '@supabase/mcp-server-supabase/apps'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { TooltipProvider } from 'ui'

import type { SqlEditorProps } from './query/sql-editor'

/**
 * Test-only fakes. Views take data as props and report actions through
 * callbacks, so tests render them directly; only `executeQuery` needs a DataPort.
 */

const unexpected = (name: string) => () =>
  Promise.reject(new Error(`Unexpected ${name} call in this test`))

export function fakeDataPort(overrides: Partial<DataPort> = {}): DataPort {
  return {
    bootstrap: unexpected('bootstrap'),
    getProjectOverview: unexpected('getProjectOverview'),
    listNotebooks: unexpected('listNotebooks'),
    listSchemas: unexpected('listSchemas'),
    listTables: unexpected('listTables'),
    readTable: unexpected('readTable'),
    readRow: unexpected('readRow'),
    updateRow: unexpected('updateRow'),
    insertRow: unexpected('insertRow'),
    getLogs: unexpected('getLogs'),
    executeSql: unexpected('executeSql'),
    queryLogs: unexpected('queryLogs'),
    ...overrides,
  }
}

export const testCapabilities: Capabilities = {
  readOnly: true,
  database: true,
  logs: true,
  createProject: false,
  creationMode: 'elicitation',
  scopedProjectId: null,
}

export const testProject: Project = {
  id: 'project-ref',
  name: 'Customer portal',
  region: 'eu-west-1',
  status: 'ACTIVE_HEALTHY',
  organization_slug: 'acme',
}

export function testTable(overrides: Partial<Table> = {}): Table {
  return {
    schema: 'public',
    name: 'items',
    rls_enabled: true,
    estimated_rows: 1,
    primary_keys: ['id'],
    editable: true,
    columns: ['id', 'label'].map((name) => ({
      name,
      data_type: 'text',
      format: 'text',
      nullable: false,
      enums: [],
      editable: true,
      generated: false,
    })),
    ...overrides,
  }
}

/** A plain textarea standing in for the host's SQL editor. */
export function TestSqlEditor({ value, onChange, onRun }: SqlEditorProps) {
  return (
    <textarea
      aria-label="SQL"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.metaKey) onRun()
      }}
    />
  )
}

/** Renders inside the `TooltipProvider` a host supplies; `rerender` keeps it. */
export function renderWithTooltip(element: ReactElement): RenderResult {
  return render(element, { wrapper: TooltipProvider })
}
