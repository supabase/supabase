import { screen } from '@testing-library/react'
import { Table, TableBody } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { TableReplicationRow } from './TableReplicationRow'
import { customRender } from '@/tests/lib/custom-render'

describe('TableReplicationRow reset progress', () => {
  it.each([true, false])('describes a pending reset when stopped is %s', (isPipelineStopped) => {
    customRender(
      <Table>
        <TableBody>
          <TableReplicationRow
            table={{
              id: 1,
              table_id: 1,
              schema: 'public',
              name: 'orders',
              table_name: 'public.orders',
              state: { name: 'following_wal' },
            }}
            isRestarting
            isPipelineStopped={isPipelineStopped}
            showDisabledState={false}
            disabledStateMessage=""
            isAnyRestartInProgress
            onSelectRestart={vi.fn()}
            onSelectShowError={vi.fn()}
          />
        </TableBody>
      </Table>
    )

    expect(screen.getByText('Resetting')).toBeInTheDocument()
    if (isPipelineStopped) {
      expect(screen.getByText(/The pipeline stays stopped until you start it/)).toBeInTheDocument()
      expect(screen.queryByText(/automatically/)).not.toBeInTheDocument()
    } else {
      expect(screen.getByText(/The pipeline restarts automatically/)).toBeInTheDocument()
    }
  })
})
