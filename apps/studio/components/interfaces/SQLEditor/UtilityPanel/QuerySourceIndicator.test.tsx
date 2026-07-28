import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, it } from 'vitest'

import { QuerySourceIndicator } from './QuerySourceIndicator'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

beforeEach(() => {
  routerMock.setCurrentUrl('/project/default/sql/existing-snippet')
})

describe('QuerySourceIndicator', () => {
  it('labels a database snippet and offers to create a logs query', async () => {
    customRender(<QuerySourceIndicator source="database" />)

    expect(screen.getByRole('button', { name: 'Query source: Database' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Query source: Database' }))
    await userEvent.click(await screen.findByText('New logs query'))

    await waitFor(() => expect(routerMock.asPath).toContain('/project/default/sql/new'))
    expect(routerMock.asPath).toContain('source=logs')
  })

  it('labels a logs snippet and offers to create a database query', async () => {
    customRender(<QuerySourceIndicator source="logs" />)

    expect(screen.getByRole('button', { name: 'Query source: Logs' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Query source: Logs' }))
    await userEvent.click(await screen.findByText('New database query'))

    await waitFor(() => expect(routerMock.asPath).toContain('/project/default/sql/new'))
    expect(routerMock.asPath).not.toContain('source=logs')
  })
})
