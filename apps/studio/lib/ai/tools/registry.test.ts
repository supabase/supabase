import type { ToolUIPart } from 'ai'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE } from './notebook-run-output'
import { sanitizeContractPart, TOOL_CONTRACTS, type StudioUIMessage } from './registry'
import type { ToolContract } from './types'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

describe('TOOL_CONTRACTS', () => {
  it('types contract tool parts on StudioUIMessage', () => {
    type Part = Extract<
      StudioUIMessage['parts'][number],
      { type: 'tool-update_notebook'; state: 'output-available' }
    >
    expectTypeOf<Part['input']>().toHaveProperty('expected_updated_at')
    expectTypeOf<Part['output']>().toHaveProperty('name')
  })
})

describe('sanitizeContractPart', () => {
  const part = {
    type: 'tool-update_notebook',
    toolCallId: 'call-1',
    state: 'output-available',
    input: {},
    output: {
      id: 'notebook-1',
      name: 'Signup funnel',
      previous_content: { schema_version: 1, cells: [] },
    },
  } as ToolUIPart

  it('drops previous_content from the model output on history replay', () => {
    expect(sanitizeContractPart(part, 'schema')?.output).toEqual({
      id: 'notebook-1',
      name: 'Signup funnel',
    })
  })

  it('drops an output that does not match the schema', () => {
    expect(sanitizeContractPart({ ...part, output: 'oops' } as ToolUIPart, 'schema')?.output).toBe(
      undefined
    )
  })

  it('returns undefined for tools without a contract', () => {
    expect(
      sanitizeContractPart({ ...part, type: 'tool-list_tables' } as ToolUIPart, 'schema')
    ).toBe(undefined)
  })
})

describe('sanitizeContractPart for run_notebook', () => {
  const output = {
    id: 'notebook-1',
    name: 'Notebook',
    updated_at: '2026-01-01T00:00:00.000Z',
    optInLevel: 'schema_and_log_and_data',
    cells: [
      {
        cell_id: 'db',
        title: 'Database',
        source: 'database',
        status: 'success',
        rows: [{ secret: 'value' }],
      },
    ],
  }
  const part = {
    type: 'tool-run_notebook',
    toolCallId: 'call-2',
    state: 'output-available',
    input: {},
    output,
  } as ToolUIPart

  it('hides rows below the data level and keeps them at the data level', () => {
    const hidden = sanitizeContractPart(part, 'schema')?.output as typeof output
    expect(hidden.cells[0]).not.toHaveProperty('rows')
    expect(sanitizeContractPart(part, 'schema_and_log_and_data')?.output).toEqual(output)
  })

  it('replaces an invalid output with an explanation instead of dropping it', () => {
    expect(sanitizeContractPart({ ...part, output: 'oops' } as ToolUIPart, 'schema')?.output).toBe(
      INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE
    )
  })
})

describe('notebook mutation contracts', () => {
  it.each(['create_notebook', 'delete_notebook'] as const)(
    '%s output is limited to id and name on replay',
    (name) => {
      const part = {
        type: `tool-${name}`,
        toolCallId: 'call-3',
        state: 'output-available',
        input: {},
        output: { id: 'notebook-1', name: 'Notebook', extra: 'ignored' },
      } as ToolUIPart
      expect(sanitizeContractPart(part, 'schema')?.output).toEqual({
        id: 'notebook-1',
        name: 'Notebook',
      })
    }
  )
})

describe('read-only contracts', () => {
  const cells = [
    { _tag: 'markdown_cell', _id: 'cell-1', text: '# Signup funnel' },
    {
      _tag: 'database_cell',
      _id: 'cell-2',
      sql: 'select 1',
      row_limit: 100,
      view: 'table',
    },
  ]
  const outputs = {
    list_databases: {
      databases: [
        { identifier: 'ref', is_primary: true, region: 'us-east-1', status: 'ACTIVE_HEALTHY' },
      ],
    },
    list_notebooks: {
      notebooks: [
        {
          id: 'notebook-1',
          name: 'Signup funnel',
          description: null,
          visibility: 'project',
          updated_at: '2026-01-01T00:00:00.000Z',
          cell_count: 2,
        },
      ],
      cursor: 'next',
    },
    list_policies: 'Policy Name: "Users can read own rows"',
    list_reports: [
      {
        id: 'report-1',
        name: 'Home',
        description: null,
        visibility: 'project',
        updated_at: '2026-01-01T00:00:00.000Z',
        chart_count: 1,
      },
    ],
    get_report: {
      id: 'report-1',
      name: 'Home',
      visibility: 'project',
      period_start: { time_period: '7d' },
      period_end: { time_period: 'today' },
      interval: '1d',
      layout: [
        {
          id: 'chart-1',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          label: 'Signups',
          attribute: 'snippet_chart-1',
          provider: 'daily-stats',
          chart_type: 'bar',
          sql: 'select 1',
          chartConfig: { type: 'bar', cumulative: false, xKey: 'day', yKey: 'count' },
        },
      ],
    },
    get_active_incidents: {
      incidents: [
        {
          kind: 'incident',
          name: 'Elevated errors',
          status: 'investigating',
          impact: 'partial_outage',
          affected_components: ['Database / API'],
          last_update_message: null,
          url: 'https://status.supabase.com/incidents/1',
        },
      ],
      message: 'There is 1 active incident on Supabase infrastructure.',
    },
    get_notebook: {
      id: 'notebook-1',
      name: 'Signup funnel',
      description: 'About signups',
      visibility: 'project',
      updated_at: '2026-01-01T00:00:00.000Z',
      cells,
    },
  }

  const levels = [
    'disabled',
    'schema',
    'schema_and_log',
    'schema_and_log_and_data',
  ] as const satisfies AiOptInLevel[]

  describe.each(Object.entries(outputs))('%s', (name, output) => {
    const part = {
      type: `tool-${name}`,
      toolCallId: 'call-4',
      state: 'output-available',
      input: {},
      output,
    } as ToolUIPart

    it.each(levels)('shows the output unchanged on replay at %s', (level) => {
      expect(sanitizeContractPart(part, level)?.output).toEqual(output)
    })

    it('drops an output that does not match the schema', () => {
      expect(sanitizeContractPart({ ...part, output: 12345 } as ToolUIPart, 'schema')?.output).toBe(
        undefined
      )
    })

    it.each(levels)('shows the live output unchanged at %s', (level) => {
      const contract: ToolContract = TOOL_CONTRACTS[name as keyof typeof outputs]
      expect(contract.toModelOutput(output, level)).toEqual(output)
    })
  })

  it.each(['escalate_to_human', 'resolve_support_conversation'] as const)(
    '%s output is limited to status on replay',
    (name) => {
      const part = {
        type: `tool-${name}`,
        toolCallId: 'call-6',
        state: 'output-available',
        input: {},
        output: { status: 'sent', extra: 'ignored' },
      } as ToolUIPart
      expect(sanitizeContractPart(part, 'disabled')?.output).toEqual({ status: 'sent' })
    }
  )

  it('accepts a notebook list without a cursor or description', () => {
    const output = {
      notebooks: [
        {
          id: 'notebook-1',
          name: 'Notebook',
          visibility: 'project',
          updated_at: '2026-01-01T00:00:00.000Z',
          cell_count: 0,
        },
      ],
    }
    const part = {
      type: 'tool-list_notebooks',
      toolCallId: 'call-5',
      state: 'output-available',
      input: {},
      output,
    } as ToolUIPart
    expect(sanitizeContractPart(part, 'schema')?.output).toEqual(output)
  })
})
