import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { wrapPlaceholderUrls } from './Message.utils'
import { OrderedList } from './MessageMarkdown'

describe('wrapPlaceholderUrls', () => {
  test('wraps a bare URL containing a placeholder in backticks', () => {
    expect(wrapPlaceholderUrls('https://<project-ref>.supabase.co/auth/v1/oauth/authorize')).toBe(
      '`https://<project-ref>.supabase.co/auth/v1/oauth/authorize`'
    )
  })

  test('leaves an already-wrapped URL unchanged', () => {
    const input = '`https://<project-ref>.supabase.co`'
    expect(wrapPlaceholderUrls(input)).toBe(input)
  })

  test('leaves URLs without placeholders unchanged', () => {
    expect(wrapPlaceholderUrls('https://supabase.com/dashboard')).toBe(
      'https://supabase.com/dashboard'
    )
  })

  test('wraps bare URL but preserves surrounding text', () => {
    expect(
      wrapPlaceholderUrls('Authorization endpoint: https://<project-ref>.supabase.co/auth/v1/oauth/authorize')
    ).toBe('Authorization endpoint: `https://<project-ref>.supabase.co/auth/v1/oauth/authorize`')
  })
})

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
