import { screen, within } from '@testing-library/react'
import { TimestampInfoProvider } from 'ui-patterns/TimestampInfo'
import { describe, expect, it } from 'vitest'

import { LogRefreshMarker } from './LogRefreshMarker'
import { customRender } from '@/tests/lib/custom-render'

describe('LogRefreshMarker', () => {
  it.each([
    {
      columnIds: ['level', 'date', 'log_type', 'status', 'event_message'],
      cellSpans: [1, 1, 3],
      timestampCellIndex: 1,
    },
    {
      columnIds: ['date', 'event_message', 'level'],
      cellSpans: [1, 2],
      timestampCellIndex: 0,
    },
    {
      columnIds: ['level', 'event_message', 'date'],
      cellSpans: [2, 1],
      timestampCellIndex: 1,
    },
    {
      columnIds: ['level', 'event_message'],
      cellSpans: [2],
      timestampCellIndex: 0,
    },
  ])(
    'follows visible column order $columnIds and the selected timezone',
    ({ columnIds, cellSpans, timestampCellIndex }) => {
      customRender(
        <TimestampInfoProvider timezone="Asia/Tokyo">
          <table>
            <tbody>
              <LogRefreshMarker
                refreshedAt={Date.parse('2026-10-09T10:35:00Z')}
                columnIds={columnIds}
              />
            </tbody>
          </table>
        </TimestampInfoProvider>
      )

      const cells = screen.getAllByRole('cell')
      expect(cells.map((cell) => Number(cell.getAttribute('colspan') ?? 1))).toEqual(cellSpans)
      expect(cellSpans.reduce((total, span) => total + span, 0)).toBe(columnIds.length)
      if (timestampCellIndex > 0) {
        expect(cells[0]).toBeEmptyDOMElement()
      }
      const timestamp = within(cells[timestampCellIndex]).getByText('09 Oct 26 19:35:00')
      expect(timestamp).toBeVisible()
      const markerCell = cells[cells.length - 1]
      if (timestampCellIndex < cells.length - 1) {
        expect(cells[timestampCellIndex]).not.toHaveTextContent('Refresh')
        expect(markerCell).not.toHaveTextContent('09 Oct 26 19:35:00')
      }
      expect(within(markerCell).getByText('Refresh')).toBeVisible()
      expect(within(markerCell).getByText('Refresh')).toHaveClass('uppercase')
      expect(screen.getByRole('row')).not.toHaveAttribute('aria-selected')
    }
  )
})
