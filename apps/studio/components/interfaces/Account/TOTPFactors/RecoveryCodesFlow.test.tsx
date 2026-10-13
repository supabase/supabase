import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, it, vi } from 'vitest'

import { RecoveryCodesFlow } from './RecoveryCodesFlow'

mockAnimationsApi()

describe('RecoveryCodesFlow', () => {
  it('keeps the save dialog open when the trigger disappears after a status refresh', () => {
    const onComplete = vi.fn()
    const mutation = {
      data: { id: 'recovery', type: 'recovery_code' as const, total: 1, codes: ['123456789012'] },
      status: 'success' as const,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      reset: vi.fn(),
    }
    const client = new QueryClient()
    const renderFlow = (showTrigger: boolean) => (
      <QueryClientProvider client={client}>
        <RecoveryCodesFlow
          action="generate"
          mutation={mutation}
          onGenerate={vi.fn()}
          onComplete={onComplete}
        >
          {({ onClick }) =>
            showTrigger ? (
              <button tabIndex={0} onClick={onClick}>
                Generate codes
              </button>
            ) : null
          }
        </RecoveryCodesFlow>
      </QueryClientProvider>
    )
    const { rerender } = render(renderFlow(true))
    fireEvent.click(screen.getByText('Generate codes'))
    expect(screen.getByText('Save your recovery codes')).toBeInTheDocument()
    rerender(renderFlow(false))
    expect(screen.getByText('Save your recovery codes')).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText('I have saved my recovery codes somewhere safe'))
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
