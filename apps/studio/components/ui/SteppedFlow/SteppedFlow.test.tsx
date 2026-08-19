import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { SteppedFlow } from './SteppedFlow'
import { customRender } from '@/tests/lib/custom-render'

const steps = [
  { id: 'destination', label: 'Destination', description: 'Choose where data should go' },
  { id: 'connection', label: 'Connection', description: 'Authorize the destination' },
  { id: 'review', label: 'Review', description: 'Confirm and create' },
]

describe('SteppedFlow', () => {
  test('does not let the user jump ahead of the current step', () => {
    const onStepChange = vi.fn()

    customRender(
      <SteppedFlow steps={steps} currentStep="destination" onStepChange={onStepChange}>
        Step body
      </SteppedFlow>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Connection, not yet available' }))
    expect(onStepChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  test('shows Back after the first step', () => {
    const onStepChange = vi.fn()

    customRender(
      <SteppedFlow steps={steps} currentStep="connection" onStepChange={onStepChange}>
        Step body
      </SteppedFlow>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onStepChange).toHaveBeenCalledWith('destination')
  })

  test('lets the user return to a completed step', () => {
    const onStepChange = vi.fn()

    customRender(
      <SteppedFlow steps={steps} currentStep="connection" onStepChange={onStepChange}>
        Step body
      </SteppedFlow>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Go to completed step: Destination' }))
    expect(onStepChange).toHaveBeenCalledWith('destination')
  })

  test('shows the final action on the last step instead of Continue', () => {
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

    expect(screen.queryByRole('button', { name: /Continue/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create and start pipeline' }))
    expect(onFinal).toHaveBeenCalledOnce()
  })
})
