import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { QueryResultData } from '../ExplorerQuery/ExplorerQuery.types'
import { QueryResultTable } from './index'

let gridProps: Record<string, any> = {}

vi.mock('react-data-grid', () => ({
  default: (props: Record<string, any>) => {
    gridProps = props
    return (
      <div role="grid" aria-label={props['aria-label']}>
        <div role="row">
          {props.columns.map((column: Record<string, any>) => (
            <div role="columnheader" key={column.key}>
              {column.renderHeaderCell()}
            </div>
          ))}
        </div>
        {props.rows.length === 0
          ? props.renderers?.noRowsFallback
          : props.rows.map((row: Record<string, unknown>, index: number) => (
              <div role="row" key={index}>
                {props.columns.map((column: Record<string, any>) => (
                  <div role="gridcell" key={column.key}>
                    {column.renderCell({ row })}
                  </div>
                ))}
              </div>
            ))}
      </div>
    )
  },
}))

const data: QueryResultData = {
  columns: [
    { key: 'id', dataType: 'int8', align: 'right' },
    { key: 'payload', dataType: 'jsonb' },
    { key: 'note', dataType: 'text' },
  ],
  rows: [{ id: 1, payload: { ready: true }, note: null }],
}

describe('QueryResultTable', () => {
  beforeEach(() => {
    gridProps = {}
  })

  it('renders explicit columns and formats source-neutral values', () => {
    render(<QueryResultTable data={data} />)

    expect(screen.getByRole('grid', { name: 'Query results' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'id' }).firstElementChild).toHaveClass(
      'heading-meta',
      'text-foreground-lighter'
    )
    expect(screen.getByRole('columnheader', { name: 'payload' })).toBeInTheDocument()
    expect(screen.getByText('{"ready":true}')).toBeInTheDocument()
    expect(screen.getByText('NULL')).toBeInTheDocument()

    expect(gridProps).toMatchObject({ headerRowHeight: 32, rowHeight: 32 })
    expect(gridProps.className).toContain('[&_.rdg-header-row>.rdg-cell]:bg-200')
    expect(gridProps.rowClass(data.rows[0], 0)).toContain('hover:bg-surface-200')
    expect(gridProps.rowClass(data.rows[0], 0)).toContain('[&>.rdg-cell]:border-b-0!')
  })

  it('preserves columns for an empty result and renders its successful empty state', () => {
    render(<QueryResultTable data={{ ...data, rows: [] }} />)

    expect(screen.getAllByRole('columnheader')).toHaveLength(3)
    expect(screen.getByText('Success. No rows returned')).toBeInTheDocument()
  })

  it('emits controlled column-width configuration', () => {
    const onConfigChange = vi.fn()

    render(
      <QueryResultTable
        data={data}
        config={{ columnWidths: { id: 140 } }}
        onConfigChange={onConfigChange}
      />
    )

    act(() => gridProps.onColumnResize(1, 280))

    expect(onConfigChange).toHaveBeenCalledWith({
      columnWidths: { id: 140, payload: 280 },
    })
  })
})
