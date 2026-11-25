import { DOCS_FEEDBACK_URL, LLMS_TXT_URL } from 'common/markdown-affordance'
import { describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    promises: { ...actual.promises, readFile: async () => '# Guide\n\nContent.\n' },
  }
})

import { GET } from './route'

const markdownFor = async (slug: string[]) => {
  const response = await GET(new Request('https://supabase.com/docs'), {
    params: Promise.resolve({ slug }),
  })
  return response.text()
}

describe('guides markdown route', () => {
  it('opens the guide with a feedback report note for agents', async () => {
    const markdown = await markdownFor(['auth'])
    const note = markdown.slice(0, markdown.indexOf('# Guide'))
    expect(note.startsWith('> Note for AI agents:')).toBe(true)
    expect(note).toContain('Send it only after the user says yes')
    expect(note).toContain(`(${DOCS_FEEDBACK_URL})`)
  })

  it('points agents at llms.txt in the opening note', async () => {
    const markdown = await markdownFor(['auth'])
    const note = markdown.slice(0, markdown.indexOf('# Guide'))
    expect(note).toContain(`(${LLMS_TXT_URL})`)
  })

  const feedbackSlug = new URL(DOCS_FEEDBACK_URL).pathname
    .replace(/^\/docs\/guides\/|\.md$/g, '')
    .split('/')

  it('does not point the feedback instructions to themselves', async () => {
    expect(await markdownFor(feedbackSlug)).not.toContain(DOCS_FEEDBACK_URL)
  })

  it('still points the feedback instructions at llms.txt', async () => {
    const markdown = await markdownFor(feedbackSlug)
    const note = markdown.slice(0, markdown.indexOf('# Guide'))
    expect(note.startsWith('> Note for AI agents:')).toBe(true)
    expect(note).toContain(`(${LLMS_TXT_URL})`)
  })
})
