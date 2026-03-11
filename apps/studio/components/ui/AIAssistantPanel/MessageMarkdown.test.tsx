import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { OrderedList } from './MessageMarkdown'

describe('OrderedList', () => {
  test('sets counter-reset based on start prop for split lists', () => {
    const { container } = render(
      <OrderedList start={3}>
        <li>Third item</li>
      </OrderedList>
    )
    const ol = container.querySelector('ol')
    expect(ol).toBeInTheDocument()
    expect(ol).toHaveAttribute('start', '3')
    expect(ol).toHaveStyle({ counterReset: 'item 2' })
  })
})
