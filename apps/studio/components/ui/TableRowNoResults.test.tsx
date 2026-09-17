import { render, screen } from '@testing-library/react'
import { Table, TableBody } from 'ui'
import { describe, expect, test } from 'vitest'

import { TableRowNoResults } from './TableRowNoResults'

describe('TableRowNoResults', () => {
  test('keeps one live region mounted while results change', () => {
    const { rerender } = render(
      <Table>
        <TableBody>
          <TableRowNoResults colSpan={2} search="users" isVisible={false} />
        </TableBody>
      </Table>
    )
    const liveRegion = screen.getByRole('status')

    expect(liveRegion).toHaveTextContent('')

    rerender(
      <Table>
        <TableBody>
          <TableRowNoResults colSpan={2} search="users" isVisible />
        </TableBody>
      </Table>
    )

    expect(screen.getByRole('status')).toBe(liveRegion)
    expect(liveRegion).toHaveTextContent('No results found')
    expect(liveRegion).toHaveTextContent('Your search for "users" did not return any results')
  })
})
