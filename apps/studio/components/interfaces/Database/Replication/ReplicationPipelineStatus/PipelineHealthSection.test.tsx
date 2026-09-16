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
  it('renders null safe WAL size as unlimited retention', () => {
    customRender(<PipelineHealthSection metrics={{ ...baseMetrics, safe_wal_size_bytes: null }} />)

    expect(screen.getByText('WAL retention remaining')).toBeInTheDocument()
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
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
