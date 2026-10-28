import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'

import { EdgeFunctionIntervalSelector } from './EdgeFunctionIntervalSelector'
import { customRender } from '@/tests/lib/custom-render'

it('identifies the selected chart period visually and updates it when another period is chosen', async () => {
  const user = userEvent.setup()
  const PeriodSelector = () => {
    const [interval, setInterval] = useState('1hr')
    return <EdgeFunctionIntervalSelector interval={interval} onIntervalChange={setInterval} />
  }

  customRender(<PeriodSelector />)

  const hour = screen.getByRole('button', { name: '1 hour', pressed: true })
  expect(within(hour).getByTestId('selected-period-indicator')).toBeVisible()

  await user.click(screen.getByRole('button', { name: '1 day' }))

  expect(
    within(screen.getByRole('button', { name: '1 day', pressed: true })).getByTestId(
      'selected-period-indicator'
    )
  ).toBeVisible()
  expect(
    within(screen.getByRole('button', { name: '1 hour', pressed: false })).queryByTestId(
      'selected-period-indicator'
    )
  ).toBeNull()
})
