import { screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { CreditBurndownChart } from './CreditBurndownChart'
import { render } from '@/tests/helpers'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type GetCreditBurndownResponse = components['schemas']['GetCreditBurndownResponse_Output']

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isSuccess: true }),
}))

describe('CreditBurndownChart', () => {
  test('shows an error message, not a stuck loading state, when the request fails', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/billing/credits/burndown',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })

    render(<CreditBurndownChart orgSlug="acme" />)

    expect(await screen.findByText('Failed to retrieve credit burndown')).toBeInTheDocument()
    expect(screen.queryByTestId('chart-line')).not.toBeInTheDocument()
  })

  test('shows an empty state when there is no burndown data in range', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/billing/credits/burndown',
      response: () => HttpResponse.json<GetCreditBurndownResponse>({ data: [] }),
    })

    render(<CreditBurndownChart orgSlug="acme" />)

    expect(await screen.findByText('No credit burndown to show')).toBeInTheDocument()
  })
})
