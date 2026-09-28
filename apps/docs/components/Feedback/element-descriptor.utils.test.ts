import { describe, expect, it } from 'vitest'

import {
  describeElement,
  getRoleNoun,
  isMeaningfulElement,
  type ElementSnapshot,
} from './element-descriptor.utils'

const createSnapshot = (overrides: Partial<ElementSnapshot> = {}): ElementSnapshot => ({
  tag: 'div',
  attributes: {},
  text: '',
  region: 'content',
  isRedacted: false,
  headingId: 'install',
  headingText: 'Install',
  pathname: '/guides/getting-started',
  ...overrides,
})

describe('isMeaningfulElement', () => {
  it('resolves a span inside a pre to the code block', () => {
    const chain = [
      { tag: 'span', attributes: {} },
      { tag: 'code', attributes: {} },
      { tag: 'pre', attributes: {} },
      { tag: 'article', attributes: {} },
    ]

    expect(chain.find(isMeaningfulElement)?.tag).toBe('pre')
  })

  it.each([['h2'], ['pre'], ['table'], ['img'], ['a'], ['button'], ['iframe']])(
    'treats <%s> as meaningful',
    (tag) => {
      expect(isMeaningfulElement({ tag, attributes: {} })).toBe(true)
    }
  )

  it('treats elements with an id or a meaningful role as meaningful', () => {
    expect(isMeaningfulElement({ tag: 'div', attributes: { id: 'config' } })).toBe(true)
    expect(isMeaningfulElement({ tag: 'div', attributes: { role: 'alert' } })).toBe(true)
    expect(isMeaningfulElement({ tag: 'div', attributes: { role: 'tab' } })).toBe(true)
  })

  it('skips generic wrappers', () => {
    expect(isMeaningfulElement({ tag: 'span', attributes: {} })).toBe(false)
    expect(isMeaningfulElement({ tag: 'div', attributes: { id: '' } })).toBe(false)
  })
})

describe('describeElement', () => {
  it('describes a code block with its heading and a text snippet of at most 80 chars', () => {
    const descriptor = describeElement(
      createSnapshot({
        tag: 'PRE',
        text: `npm install @supabase/supabase-js\n\n   ${'x'.repeat(200)}`,
      })
    )

    expect(descriptor).toMatchObject({
      tag: 'pre',
      role: 'code',
      headingId: 'install',
      headingText: 'Install',
      pathname: '/guides/getting-started',
    })
    expect(descriptor.text).toMatch(/^npm install @supabase\/supabase-js x+…$/)
    expect(descriptor.text).toHaveLength(80)
  })

  it('uses aria-label over inner text for the name', () => {
    const descriptor = describeElement(
      createSnapshot({ tag: 'button', attributes: { 'aria-label': 'Copy' }, text: 'Copy code' })
    )

    expect(descriptor).toMatchObject({ role: 'button', name: 'Copy', text: 'Copy code' })
  })

  it('falls back through labelledby text, text, title and alt for the name', () => {
    expect(
      describeElement(createSnapshot({ tag: 'button', labelledByText: 'Run', text: 'Go' })).name
    ).toBe('Run')
    expect(describeElement(createSnapshot({ tag: 'a', text: '  Next   page ' })).name).toBe(
      'Next page'
    )
    expect(
      describeElement(createSnapshot({ tag: 'button', attributes: { title: 'Close' } })).name
    ).toBe('Close')
    expect(
      describeElement(createSnapshot({ tag: 'img', attributes: { alt: 'Architecture diagram' } }))
    ).toMatchObject({ role: 'img', name: 'Architecture diagram', text: null })
  })

  it('returns null name and text when nothing is available', () => {
    expect(describeElement(createSnapshot({ tag: 'span' }))).toMatchObject({
      role: 'generic',
      name: null,
      text: null,
    })
  })

  it('prefers an explicit role and uses its first token', () => {
    expect(
      describeElement(createSnapshot({ tag: 'div', attributes: { role: 'tab presentation' } })).role
    ).toBe('tab')
  })

  it.each([
    ['a', undefined, 'link'],
    ['button', undefined, 'button'],
    ['h3', undefined, 'heading'],
    ['table', undefined, 'table'],
    ['iframe', undefined, 'iframe'],
    ['input', 'checkbox', 'checkbox'],
    ['input', 'search', 'searchbox'],
    ['input', 'submit', 'button'],
    ['input', undefined, 'textbox'],
    ['textarea', undefined, 'textbox'],
    ['select', undefined, 'combobox'],
  ])('derives the implicit role of <%s type=%s> as %s', (tag, type, role) => {
    const attributes = type ? { type } : {}
    expect(describeElement(createSnapshot({ tag, attributes })).role).toBe(role)
  })

  it('nulls text and name inside a redacted region, keeping tag, role and heading', () => {
    expect(
      describeElement(
        createSnapshot({
          tag: 'button',
          attributes: { 'aria-label': 'Copy key' },
          text: 'sb_secret_123',
          isRedacted: true,
        })
      )
    ).toEqual({
      tag: 'button',
      role: 'button',
      name: null,
      text: null,
      headingId: 'install',
      headingText: 'Install',
      pathname: '/guides/getting-started',
    })
  })

  it('never includes a value for an input and never reads its title or alt', () => {
    const descriptor = describeElement(
      createSnapshot({
        tag: 'input',
        attributes: { type: 'text', title: 'my-secret', alt: 'secret' },
        text: 'typed value',
      })
    )

    expect(descriptor).not.toHaveProperty('value')
    expect(descriptor).toMatchObject({ role: 'textbox', name: null, text: null })
  })

  it('names a value-bearing control from aria-label, labelledby or <label> only', () => {
    expect(
      describeElement(
        createSnapshot({
          tag: 'input',
          attributes: { 'aria-label': 'Search docs' },
          labelText: 'Search',
          text: 'auth',
        })
      )
    ).toMatchObject({ name: 'Search docs', text: null })
    expect(
      describeElement(createSnapshot({ tag: 'textarea', labelledByText: 'Message' })).name
    ).toBe('Message')
    expect(describeElement(createSnapshot({ tag: 'select', labelText: 'Region' })).name).toBe(
      'Region'
    )
  })

  it('returns a null name for a combobox trigger with no label', () => {
    expect(
      describeElement(
        createSnapshot({ tag: 'button', attributes: { role: 'combobox' }, text: 'Acme / prod-db' })
      )
    ).toMatchObject({ role: 'combobox', name: null, text: null })
  })

  it('treats contenteditable elements as value-bearing', () => {
    expect(
      describeElement(
        createSnapshot({ tag: 'div', attributes: { contenteditable: 'true' }, text: 'draft' })
      )
    ).toMatchObject({ role: 'textbox', name: null, text: null })
    expect(
      describeElement(
        createSnapshot({ tag: 'div', attributes: { contenteditable: 'false' }, text: 'shown' })
      )
    ).toMatchObject({ name: 'shown', text: 'shown' })
  })

  it.each([['listbox'], ['option'], ['textbox'], ['searchbox']])(
    'treats role=%s as value-bearing',
    (role) => {
      expect(
        describeElement(createSnapshot({ tag: 'div', attributes: { role }, text: 'my-project' }))
      ).toMatchObject({ name: null, text: null })
    }
  )

  it('keeps only tag, role and pathname outside the allowed regions', () => {
    expect(
      describeElement(
        createSnapshot({
          tag: 'button',
          attributes: { 'aria-label': 'jane@example.com', alt: 'jane@example.com' },
          text: 'jane@example.com',
          region: 'other',
        })
      )
    ).toEqual({
      tag: 'button',
      role: 'button',
      name: null,
      text: null,
      headingId: null,
      headingText: null,
      pathname: '/guides/getting-started',
    })
  })

  it.each([['nav' as const], ['rail' as const]])('captures text in the %s region', (region) => {
    expect(describeElement(createSnapshot({ tag: 'a', text: 'Auth', region })).name).toBe('Auth')
  })

  it('caps the name at 120 characters without splitting a surrogate pair', () => {
    const name = describeElement(
      createSnapshot({ tag: 'a', text: `${'a'.repeat(118)}😀tail` })
    ).name

    expect(name).toBe(`${'a'.repeat(118)}…`)
  })

  it('strips control characters', () => {
    expect(describeElement(createSnapshot({ tag: 'a', text: 'Auth\u0000\u0007 guide' })).name).toBe(
      'Auth guide'
    )
  })

  it('normalizes the heading and drops an over-long heading id', () => {
    expect(
      describeElement(
        createSnapshot({ headingId: 'x'.repeat(121), headingText: `  ${'h'.repeat(200)} ` })
      )
    ).toMatchObject({ headingId: null, headingText: `${'h'.repeat(119)}…` })
  })

  it('strips the query string and hash from the pathname', () => {
    expect(
      describeElement(createSnapshot({ pathname: '/guides/auth?token=abc#access_token=def' }))
        .pathname
    ).toBe('/guides/auth')
  })

  it('caps the tag and role lengths', () => {
    const descriptor = describeElement(
      createSnapshot({ tag: `x-${'a'.repeat(30)}`, attributes: { role: 'r'.repeat(50) } })
    )

    expect(descriptor.tag).toHaveLength(20)
    expect(descriptor.role).toHaveLength(40)
  })
})

describe('getRoleNoun', () => {
  it.each([
    ['button', 'button'],
    ['code', 'code block'],
    ['textbox', 'field'],
    ['searchbox', 'field'],
    ['img', 'image'],
    ['alert', 'callout'],
    ['generic', 'element'],
    ['made-up', 'element'],
  ])('maps %s to %s', (role, noun) => {
    expect(getRoleNoun(role)).toBe(noun)
  })
})
