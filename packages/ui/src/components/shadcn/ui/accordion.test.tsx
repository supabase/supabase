import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Accordion, AccordionItem, AccordionTrigger } from './accordion'

describe('AccordionTrigger', () => {
  it('fills its container without adding horizontal padding', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced settings</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    )

    const trigger = screen.getByRole('button', { name: 'Advanced settings' })
    expect(trigger.parentElement).toHaveClass('flex', 'w-full')
    expect(trigger).toHaveClass('flex-1', 'relative', 'focus-inset')
    expect(trigger).not.toHaveClass('px-2')
    expect(trigger).not.toHaveClass('rounded-md')
    expect(trigger).not.toHaveClass('focus-ring')
    expect(trigger).not.toHaveClass('transition-colors')
    expect(trigger).not.toHaveClass('transition-all')
  })

  it('supports an outer focus ring when explicitly requested', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger focusVariant="ring">Advanced settings</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    )

    const trigger = screen.getByRole('button', { name: 'Advanced settings' })
    expect(trigger).toHaveClass('rounded-md', 'focus-ring')
    expect(trigger).not.toHaveClass('focus-inset')
  })
})
