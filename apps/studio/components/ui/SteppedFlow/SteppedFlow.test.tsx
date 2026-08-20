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

  test('renders a step header heading', () => {
    customRender(
      <SteppedFlow steps={steps} currentStep="destination" onStepChange={vi.fn()}>
        <SteppedFlowHeader title="Choose a destination" description="Where should data go?" />
      </SteppedFlow>
    )

    expect(screen.getByRole('heading', { name: 'Choose a destination' })).toBeInTheDocument()
    expect(screen.getByText('Where should data go?')).toBeInTheDocument()
  })

  test('renders optional header actions', () => {
    customRender(
      <SteppedFlow steps={steps} currentStep="connection" onStepChange={vi.fn()}>
        <SteppedFlowHeader
          title="Authorize the destination"
          description="Name this pipeline."
          actions={<button type="button">Docs</button>}
        />
      </SteppedFlow>
    )

    expect(screen.getByRole('button', { name: 'Docs' })).toBeInTheDocument()
  })

  test('disables Back while navigation is locked', () => {
    customRender(
      <SteppedFlow
        steps={steps}
        currentStep="review"
        onStepChange={vi.fn()}
        navigationDisabled
        finalAction={{ label: 'Create and start pipeline', loading: true }}
      >
        Step body
      </SteppedFlow>
    )

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
  })
})
