import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFlag } from 'common'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AddIntegrationDropdown, SCALEKIT_TPA_FLAG } from './AddIntegrationDropdown'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('common', async () => {
  const actual = await vi.importActual<typeof import('common')>('common')
  return {
    ...actual,
    useFlag: vi.fn(),
  }
})

const renderMenu = () => {
  customRender(<AddIntegrationDropdown onSelectIntegrationType={vi.fn()} />)
}

describe('AddIntegrationDropdown Scalekit', () => {
  beforeEach(() => {
    vi.mocked(useFlag).mockReturnValue(false)
  })

  test('hides Scalekit when the flag is off', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Add provider' }))
    expect(screen.queryByText('Scalekit')).not.toBeInTheDocument()
    expect(screen.getByText('WorkOS')).toBeInTheDocument()
  })

  test('shows Scalekit when the flag is on', async () => {
    vi.mocked(useFlag).mockImplementation((name: string) => name === SCALEKIT_TPA_FLAG)
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Add provider' }))
    expect(screen.getByText('Scalekit')).toBeInTheDocument()
  })
})
