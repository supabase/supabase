import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Success } from './Success'
import { customRender } from '@/tests/lib/custom-render'

describe('Success', () => {
  it('renders a local finish action when provided', async () => {
    const onFinish = vi.fn()

    customRender(<Success onFinish={onFinish} finishLabel="Done" />)

    expect(screen.queryByRole('link', { name: 'Done' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(onFinish).toHaveBeenCalledTimes(1)
  })
})
