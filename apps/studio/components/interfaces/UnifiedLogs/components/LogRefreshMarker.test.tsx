import { screen, within } from '@testing-library/react'
import { TimestampInfoProvider } from 'ui-patterns/TimestampInfo'
import { describe, expect, it } from 'vitest'

import { LogRefreshMarker } from './LogRefreshMarker'
import { customRender } from '@/tests/lib/custom-render'

describe('LogRefreshMarker', () => {
  it.each([
    { columnIds: ['level', 'date', 'event_message'], leadingColumns: 1 },
    { columnIds: ['date', 'event_message', 'level'], leadingColumns: 0 },
    { columnIds: ['level', 'event_message', 'date'], leadingColumns: 2 },
    { columnIds: ['level', 'event_message'], leadingColumns: 0 },
  ])(
    'follows visible column order $columnIds and the selected timezone',
    ({ columnIds, leadingColumns }) => {
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
      if (leadingColumns > 0) {
        expect(cells[0]).toBeEmptyDOMElement()
        expect(cells[0]).toHaveAttribute('colspan', String(leadingColumns))
      }
      const markerCell = cells[cells.length - 1]
      expect(markerCell).toHaveAttribute('colspan', String(columnIds.length - leadingColumns))
      expect(markerCell).toHaveTextContent('09 Oct 26 19:35:00Refresh')
      expect(within(markerCell).getByText('Refresh')).toBeVisible()
      expect(screen.getByRole('row')).not.toHaveAttribute('aria-selected')
    }
  )
})
