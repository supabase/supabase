import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Collapsible, CollapsibleTrigger } from './collapsible'

describe('CollapsibleTrigger', () => {
  it('keeps the inset focus ring when an asChild trigger already has an outer ring', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="focus-ring">Toggle</button>
        </CollapsibleTrigger>
      </Collapsible>
    )

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(trigger).toHaveClass(
      'focus-ring',
      'focus-inset',
      '!outline-solid',
      'focus-visible:!ring-0',
      'focus-visible:!ring-offset-0'
    )
  })
})
