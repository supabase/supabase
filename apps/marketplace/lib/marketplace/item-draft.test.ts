import { describe, expect, it } from 'vitest'

import {
  ensureItemDraftConstraints,
  parseItemType,
  parseNumberList,
  parseOptionalString,
  parseRequiredString,
  parseTemplateZip,
  slugify,
} from './item-draft'

describe('item-draft utils', () => {
  it('slugifies user-facing titles', () => {
    expect(slugify('  Auth Starter: OAuth  ')).toBe('auth-starter-oauth')
  })

  it('parses required and optional strings', () => {
    const formData = new FormData()
    formData.set('title', '  My Item  ')
    formData.set('maybe', '   ')

    expect(parseRequiredString(formData, 'title')).toBe('My Item')
    expect(parseOptionalString(formData, 'maybe')).toBeNull()
    expect(() => parseRequiredString(formData, 'missing')).toThrow('Missing required field: missing')
  })

  it('parses positive unique number lists', () => {
    const formData = new FormData()
    formData.append('removedFileIds[]', '3')
    formData.append('removedFileIds[]', '2')
    formData.append('removedFileIds[]', '2')
    formData.append('removedFileIds[]', '-1')
    formData.append('removedFileIds[]', 'abc')

    expect(parseNumberList(formData, 'removedFileIds[]')).toEqual([2, 3])
  })

  it('parses item type enum safely', () => {
    expect(parseItemType('oauth')).toBe('oauth')
    expect(parseItemType('template')).toBe('template')
    expect(parseItemType('unknown')).toBeNull()
  })

  it('requires valid constraints by item type', () => {
    const templateFile = new File(['x'], 'template.zip', { type: 'application/zip' })

    expect(() =>
      ensureItemDraftConstraints({
        type: 'oauth',
        slug: 'oauth-item',
        url: null,
        templateZip: null,
      })
    ).toThrow('OAuth items require a listing URL')

    expect(() =>
      ensureItemDraftConstraints({
        type: 'template',
        slug: 'template-item',
        url: null,
        templateZip: null,
        published: true,
      })
    ).toThrow('Template items require a template ZIP package before publishing or requesting review')

    expect(() =>
      ensureItemDraftConstraints({
        type: 'template',
        slug: 'template-item',
        url: null,
        templateZip: templateFile,
        published: true,
      })
    ).not.toThrow()
  })

  it('allows template drafts without a template package', () => {
    expect(() =>
      ensureItemDraftConstraints({
        type: 'template',
        slug: 'template-item',
        url: null,
        templateZip: null,
      })
    ).not.toThrow()
  })

  it('requires a template package when requesting review', () => {
    expect(() =>
      ensureItemDraftConstraints({
        type: 'template',
        slug: 'template-item',
        url: null,
        templateZip: null,
        intent: 'request_review',
      })
    ).toThrow('Template items require a template ZIP package before publishing or requesting review')
  })

  it('parses template zip file only when provided', () => {
    const formData = new FormData()
    const zip = new File(['zip'], 'template.zip', { type: 'application/zip' })
    formData.set('templateZip', zip)

    expect(parseTemplateZip(formData)).toBe(zip)
    expect(parseTemplateZip(new FormData())).toBeNull()
  })
})
