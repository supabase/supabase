import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PipelineHealthSection } from './PipelineHealthSection'
import { customRender } from '@/tests/lib/custom-render'

const baseMetrics = {
  active: true,
  confirmed_flush_lsn_bytes: 0,
  restart_lsn_bytes: 0,
  reply_time_lag: 0,
}

describe('PipelineHealthSection', () => {
  it.each([null, undefined])(
    'renders unavailable headroom (%s) without claiming unlimited retention',
    (headroom) => {
      customRender(
        <PipelineHealthSection metrics={{ ...baseMetrics, safe_wal_size_bytes: headroom }} />
      )

      expect(screen.getByText('WAL retention remaining')).toBeInTheDocument()
      expect(screen.getByText('Unavailable')).toBeInTheDocument()
      expect(screen.queryByText('Unlimited')).not.toBeInTheDocument()
    }
  )

  it('does not show caught up when slot lag is null', () => {
    customRender(
      <PipelineHealthSection
        metrics={{ ...baseMetrics, confirmed_flush_lsn_bytes: null, safe_wal_size_bytes: 1024 }}
      />
    )

    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Caught up')).not.toBeInTheDocument()
  })

  it('formats a numeric safe WAL size normally', () => {
    customRender(<PipelineHealthSection metrics={{ ...baseMetrics, safe_wal_size_bytes: 1024 }} />)

    expect(screen.getByText('1 KB')).toBeInTheDocument()
  })

  it('shows the absolute last check-in time on hover', async () => {
    customRender(<PipelineHealthSection metrics={{ ...baseMetrics, safe_wal_size_bytes: null }} />)

    await userEvent.hover(screen.getByText('Just now'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(/\w{3} \d{1,2}, \d{4}/)
  })
})
