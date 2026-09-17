import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SlotLagMetricsList } from './SlotLagMetrics'
import { customRender } from '@/tests/lib/custom-render'

const baseMetrics = {
  active: true,
  confirmed_flush_lsn_bytes: 0,
  restart_lsn_bytes: 0,
  reply_time_lag: 0,
}

describe('SlotLagMetricsList', () => {
  it('renders null safe WAL size as unlimited retention', () => {
    customRender(<SlotLagMetricsList metrics={{ ...baseMetrics, safe_wal_size_bytes: null }} />)

    expect(screen.getByText('WAL retention remaining')).toBeInTheDocument()
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
  })

  it('formats a numeric safe WAL size normally', () => {
    customRender(<SlotLagMetricsList metrics={{ ...baseMetrics, safe_wal_size_bytes: 1024 }} />)

    expect(screen.getByText('1 KB')).toBeInTheDocument()
  })
})
