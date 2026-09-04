import { describe, expect, it } from 'vitest'

import { defaultUrlTransform, wrapPlaceholderUrls } from './Message.utils'

describe('wrapPlaceholderUrls', () => {
  it('wraps a URL containing angle bracket placeholders in backticks', () => {
    const input = 'Visit https://supabase.co/project/<project-ref>/settings for details'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe('Visit `https://supabase.co/project/<project-ref>/settings` for details')
  })

  it('handles multiple placeholder URLs in the same text', () => {
    const input =
      'Use https://api.supabase.co/<project-ref>/rest and https://db.supabase.co/<project-ref>/sql'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe(
      'Use `https://api.supabase.co/<project-ref>/rest` and `https://db.supabase.co/<project-ref>/sql`'
    )
  })

  it('preserves trailing punctuation outside backticks', () => {
    const input = 'Check https://supabase.co/<project-ref>/settings.'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe('Check `https://supabase.co/<project-ref>/settings`.')
  })

  it('preserves multiple trailing punctuation characters outside backticks', () => {
    const input = 'Visit https://supabase.co/<project-ref>/auth!!'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe('Visit `https://supabase.co/<project-ref>/auth`!!')
  })

  it('leaves URLs already inside inline code unchanged', () => {
    const input = 'Use `https://supabase.co/<project-ref>/settings` here'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe('Use `https://supabase.co/<project-ref>/settings` here')
  })

  it('leaves URLs inside fenced code blocks unchanged', () => {
    const input = '```\nhttps://supabase.co/<project-ref>/settings\n```'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe('```\nhttps://supabase.co/<project-ref>/settings\n```')
  })

  it('returns text unchanged when there are no angle brackets', () => {
    const input = 'Visit https://supabase.com/dashboard for more info'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe('Visit https://supabase.com/dashboard for more info')
  })

  it('returns empty string for empty input', () => {
    const result = wrapPlaceholderUrls('')
    expect(result).toBe('')
  })

  it('does not wrap URLs that have angle brackets but no placeholder pattern', () => {
    // The regex expects <word-word> or <word> pattern with lowercase letters
    const input = 'Some text with <b>bold</b> HTML'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe('Some text with <b>bold</b> HTML')
  })

  it('wraps a URL with multiple placeholder segments', () => {
    const input = 'Endpoint: https://api.supabase.co/<project-ref>/functions/<function-name>'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe(
      'Endpoint: `https://api.supabase.co/<project-ref>/functions/<function-name>`'
    )
  })

  it('handles mixed code and plain text with placeholder URLs', () => {
    const input =
      'Run `curl https://example.com` or visit https://supabase.co/<project-ref>/api directly'
    const result = wrapPlaceholderUrls(input)
    expect(result).toBe(
      'Run `curl https://example.com` or visit `https://supabase.co/<project-ref>/api` directly'
    )
  })
})

describe('defaultUrlTransform', () => {
  it('passes through https URLs unchanged', () => {
    expect(defaultUrlTransform('https://supabase.com')).toBe('https://supabase.com')
  })

  it('passes through http URLs unchanged', () => {
    expect(defaultUrlTransform('http://example.com')).toBe('http://example.com')
  })

  it('passes through mailto URLs unchanged', () => {
    expect(defaultUrlTransform('mailto:user@example.com')).toBe('mailto:user@example.com')
  })

  it('passes through xmpp URLs unchanged', () => {
    expect(defaultUrlTransform('xmpp:user@example.com')).toBe('xmpp:user@example.com')
  })

  it('passes through ircs URLs unchanged', () => {
    expect(defaultUrlTransform('ircs://irc.example.com/channel')).toBe(
      'ircs://irc.example.com/channel'
    )
  })

  it('passes through irc URLs unchanged', () => {
    expect(defaultUrlTransform('irc://irc.example.com/channel')).toBe(
      'irc://irc.example.com/channel'
    )
  })

  it('passes through relative paths unchanged', () => {
    expect(defaultUrlTransform('/path/to/resource')).toBe('/path/to/resource')
  })

  it('passes through relative URLs with query params', () => {
    expect(defaultUrlTransform('/search?q=test')).toBe('/search?q=test')
  })

  it('passes through URLs with fragments', () => {
    expect(defaultUrlTransform('#section-heading')).toBe('#section-heading')
  })

  it('returns empty string for javascript: protocol', () => {
    expect(defaultUrlTransform('javascript:alert(1)')).toBe('')
  })

  it('returns empty string for data: protocol', () => {
    expect(defaultUrlTransform('data:text/html,<h1>hi</h1>')).toBe('')
  })

  it('returns empty string for vbscript: protocol', () => {
    expect(defaultUrlTransform('vbscript:msgbox("hi")')).toBe('')
  })

  it('returns empty string for unknown protocols', () => {
    expect(defaultUrlTransform('custom:something')).toBe('')
  })

  it('treats colon after slash as not a protocol', () => {
    expect(defaultUrlTransform('/path:with-colon')).toBe('/path:with-colon')
  })

  it('treats colon after question mark as not a protocol', () => {
    expect(defaultUrlTransform('?query:value')).toBe('?query:value')
  })

  it('treats colon after hash as not a protocol', () => {
    expect(defaultUrlTransform('#hash:value')).toBe('#hash:value')
  })
})
