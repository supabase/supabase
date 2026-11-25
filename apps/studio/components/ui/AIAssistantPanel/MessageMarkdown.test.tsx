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
      wrapPlaceholderUrls(
        'Authorization endpoint: https://<project-ref>.supabase.co/auth/v1/oauth/authorize'
      )
    ).toBe('Authorization endpoint: `https://<project-ref>.supabase.co/auth/v1/oauth/authorize`')
  })

  test('skips URLs inside markdown link destinations', () => {
    const input = '[OAuth docs](https://<project-ref>.supabase.co/auth/v1/oauth/authorize)'
    expect(wrapPlaceholderUrls(input)).toBe(input)
  })

  test('wraps placeholder URL used as markdown link text', () => {
    expect(
      wrapPlaceholderUrls('[https://<project-ref>.supabase.co](https://supabase.com/dashboard)')
    ).toBe('[`https://<project-ref>.supabase.co`](https://supabase.com/dashboard)')
  })

  test('wraps bare URL but skips linked URL when both appear in the same string', () => {
    expect(
      wrapPlaceholderUrls(
        'Use [link](https://<project-ref>.supabase.co) or https://<project-ref>.supabase.co/raw'
      )
    ).toBe(
      'Use [link](https://<project-ref>.supabase.co) or `https://<project-ref>.supabase.co/raw`'
    )
  })

  test('leaves placeholder URLs inside fenced code blocks unchanged', () => {
    const input = '```\nhttps://<project-ref>.supabase.co\n```'
    expect(wrapPlaceholderUrls(input)).toBe(input)
  })

  test('strips trailing prose punctuation before wrapping', () => {
    expect(wrapPlaceholderUrls('See https://<project-ref>.supabase.co/auth, then proceed.')).toBe(
      'See `https://<project-ref>.supabase.co/auth`, then proceed.'
    )
  })

  test('wraps URLs whose angle-bracket segment has no hyphen', () => {
    expect(wrapPlaceholderUrls('https://example.com/path?id=<ref>')).toBe(
      '`https://example.com/path?id=<ref>`'
    )
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
