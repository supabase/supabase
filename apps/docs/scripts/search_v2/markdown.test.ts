import { describe, expect, it } from 'vitest'

import {
  extractExcerpt,
  extractSections,
  extractTitle,
  nodeToText,
  parseMarkdownAst,
  parsePage,
} from './markdown.js'

const USERS_MD = `# Users

A **user** in Supabase Auth is someone with a user ID, stored in the Auth schema. You can restrict access via [RLS policies](https://example.com).

## Permanent and anonymous users

Supabase distinguishes between permanent and anonymous users.

- **Permanent users** are tied to PII.
- **Anonymous users** aren't tied to any identities.

## Inviting users

You can invite someone by email.

### Using the Dashboard

1. Go to **Authentication > Users**.
2. Click **Add user**.

### Using the Auth Admin API

Call \`inviteUserByEmail()\` from a server.

\`\`\`js
const x = 1
\`\`\`
`

describe('extractTitle', () => {
  it('returns the first H1', () => {
    expect(extractTitle(parseMarkdownAst(USERS_MD))).toBe('Users')
  })

  it('returns an empty string when there is no H1', () => {
    expect(extractTitle(parseMarkdownAst('## Only an h2\n\nText.'))).toBe('')
  })

  it('strips inline formatting from the heading', () => {
    expect(extractTitle(parseMarkdownAst('# The `code` **title**'))).toBe('The code title')
  })
})

describe('extractExcerpt', () => {
  it('returns the first paragraph as plain text', () => {
    expect(extractExcerpt(parseMarkdownAst(USERS_MD))).toBe(
      'A user in Supabase Auth is someone with a user ID, stored in the Auth schema. You can restrict access via RLS policies.'
    )
  })

  it('skips YAML frontmatter', () => {
    const md = `---\ntitle: Hello\n---\n\n# Title\n\nFirst paragraph.`
    expect(extractExcerpt(parseMarkdownAst(md))).toBe('First paragraph.')
  })

  it('returns an empty string when there is no paragraph', () => {
    expect(extractExcerpt(parseMarkdownAst('# Just a heading'))).toBe('')
  })
})

describe('extractSections', () => {
  const sections = extractSections(parseMarkdownAst(USERS_MD))

  it('creates one section per heading', () => {
    expect(sections.map((s) => s.heading)).toEqual([
      'Users',
      'Permanent and anonymous users',
      'Inviting users',
      'Using the Dashboard',
      'Using the Auth Admin API',
    ])
  })

  it('records heading levels', () => {
    expect(sections.map((s) => s.level)).toEqual([1, 2, 2, 3, 3])
  })

  it('builds the heading path from the H1 down to the section', () => {
    expect(sections[1].headingPath).toEqual(['Users', 'Permanent and anonymous users'])
    expect(sections[3].headingPath).toEqual(['Users', 'Inviting users', 'Using the Dashboard'])
  })

  it('resets the path when a sibling heading appears', () => {
    expect(sections[4].headingPath).toEqual(['Users', 'Inviting users', 'Using the Auth Admin API'])
  })

  it('collects body text (paragraphs and lists) under each heading', () => {
    expect(sections[1].content).toContain(
      'Supabase distinguishes between permanent and anonymous users.'
    )
    expect(sections[1].content).toContain('Permanent users are tied to PII.')
    expect(sections[1].content).toContain("Anonymous users aren't tied to any identities.")
  })

  it('does not leak content across sections', () => {
    expect(sections[0].content).not.toContain('Supabase distinguishes')
    expect(sections[1].content).not.toContain('invite')
  })

  it('includes code block text in the section body', () => {
    expect(sections[4].content).toContain('const x = 1')
  })

  it('keeps text before the first heading as a headless section', () => {
    const md = `Intro paragraph.\n\n# Title\n\nBody.`
    const result = extractSections(parseMarkdownAst(md))
    expect(result[0]).toEqual({
      heading: '',
      level: 0,
      headingPath: [],
      content: 'Intro paragraph.',
    })
    expect(result[1].headingPath).toEqual(['Title'])
  })
})

describe('nodeToText', () => {
  it('separates table cells and rows so words do not run together', () => {
    const md = `| Attr | Type |\n| --- | --- |\n| id | string |\n| aud | string |`
    const table = parseMarkdownAst(md).children[0]
    expect(nodeToText(table)).toBe('Attr | Type\nid | string\naud | string')
  })

  it('puts list items on separate lines', () => {
    const list = parseMarkdownAst('- one\n- two').children[0]
    expect(nodeToText(list)).toBe('one\ntwo')
  })
})

describe('parsePage', () => {
  it('combines title, excerpt and sections', () => {
    const page = parsePage(USERS_MD)
    expect(page.title).toBe('Users')
    expect(page.excerpt.startsWith('A user in Supabase Auth')).toBe(true)
    expect(page.sections).toHaveLength(5)
  })
})
