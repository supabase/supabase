import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { SteppedFlow, SteppedFlowHeader } from './SteppedFlow'
import { customRender } from '@/tests/lib/custom-render'

const steps = [
  { id: 'destination', label: 'Destination' },
  { id: 'connection', label: 'Connection' },
  { id: 'review', label: 'Review' },
]

describe('SteppedFlow', () => {
  test('offers Cancel instead of Back on the first step, and advances when onNext is omitted', () => {
    const onCancel = vi.fn()
    const onStepChange = vi.fn()

    customRender(
      <SteppedFlow
        steps={steps}
        currentStep="destination"
        onStepChange={onStepChange}
        onCancel={onCancel}
      >
        Step body
      </SteppedFlow>
    )

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onStepChange).toHaveBeenCalledWith('connection')
  })

  test('offers Back instead of Cancel after the first step', () => {
    const onStepChange = vi.fn()

    customRender(
      <SteppedFlow
        steps={steps}
        currentStep="connection"
        onStepChange={onStepChange}
        onCancel={vi.fn()}
      >
        Step body
      </SteppedFlow>
    )

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onStepChange).toHaveBeenCalledWith('destination')
  })

  test('shows the final action on the last step instead of Next', () => {
    const onFinal = vi.fn()

    customRender(
      <SteppedFlow
        steps={steps}
        currentStep="review"
        onStepChange={vi.fn()}
        onNext={vi.fn()}
        finalAction={{ label: 'Create and start pipeline', onClick: onFinal }}
      >
        Step body
      </SteppedFlow>
    )

    expect(screen.queryByRole('button', { name: /Next/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create and start pipeline' }))
    expect(onFinal).toHaveBeenCalledOnce()
  })

  test('renders a step header with its heading, description and optional actions', () => {
    customRender(
      <SteppedFlow steps={steps} currentStep="destination" onStepChange={vi.fn()}>
        <SteppedFlowHeader
          title="Choose a destination"
          description="Where should data go?"
          actions={
            <button type="button" tabIndex={0}>
              Docs
            </button>
          }
        />
      </SteppedFlow>
    )

    expect(screen.getByRole('heading', { name: 'Choose a destination' })).toBeInTheDocument()
    expect(screen.getByText('Where should data go?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Docs' })).toBeInTheDocument()
  })

  test('disables Back and the final action while navigation is locked', () => {
    customRender(
      <SteppedFlow
        steps={steps}
        currentStep="review"
        onStepChange={vi.fn()}
        navigationDisabled
        finalAction={{ label: 'Create and start pipeline' }}
      >
        Step body
      </SteppedFlow>
    )

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create and start pipeline' })).toBeDisabled()
  })

  test('disables Next while navigation is locked', () => {
    customRender(
      <SteppedFlow
        steps={steps}
        currentStep="destination"
        onStepChange={vi.fn()}
        navigationDisabled
      >
        Step body
      </SteppedFlow>
    )

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
