import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { SteppedFlow } from './SteppedFlow'
import { customRender } from '@/tests/lib/custom-render'

const steps = [
  { id: 'destination', label: 'Destination' },
  { id: 'connection', label: 'Connection' },
  { id: 'review', label: 'Review' },
]

describe('SteppedFlow', () => {
  test('does not show Back on the first step', () => {
    customRender(
      <SteppedFlow steps={steps} currentStep="destination" onStepChange={vi.fn()}>
        Step body
      </SteppedFlow>
    )

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
