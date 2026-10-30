import { fireEvent, render, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { describe, expect, it } from 'vitest'

import { AnnotatedSpan } from './CodeBlockAnnotation'

const renderSpan = () =>
  render(
    <TooltipProvider delayDuration={0}>
      <AnnotatedSpan
        content="createClient"
        className="s-v"
        annotations={[{ text: 'function createClient(): SupabaseClient' }]}
      />
    </TooltipProvider>
  )

const tap = (element: HTMLElement) => {
  fireEvent.pointerDown(element, { pointerType: 'touch' })
  fireEvent.click(element)
}

describe('AnnotatedSpan', () => {
  it('opens on a touch tap and closes on the next tap', () => {
    renderSpan()
    const trigger = screen.getByRole('button', { name: 'createClient' })

    tap(trigger)
    expect(screen.getByRole('tooltip')).toHaveTextContent('function createClient(): SupabaseClient')

    tap(trigger)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('leaves a mouse click to radix, which keeps the tooltip closed', () => {
    renderSpan()
    const trigger = screen.getByRole('button', { name: 'createClient' })

    fireEvent.pointerDown(trigger, { pointerType: 'mouse' })
    fireEvent.click(trigger)

    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
