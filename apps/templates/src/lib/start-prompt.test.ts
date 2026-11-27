import { describe, expect, it } from 'vitest'

import { buildStartPrompt, parseGitHubSource } from './start-prompt'
import { getExample } from '@/data/registry'

describe('parseGitHubSource', () => {
  it('splits a monorepo folder URL', () => {
    expect(
      parseGitHubSource(
        'https://github.com/supabase/supabase/tree/master/examples/templates/kanban'
      )
    ).toEqual({
      cloneUrl: 'https://github.com/supabase/supabase.git',
      branch: 'master',
      path: 'examples/templates/kanban',
    })
  })

  it('handles a whole-repo URL', () => {
    expect(parseGitHubSource('https://github.com/acme/app')).toEqual({
      cloneUrl: 'https://github.com/acme/app.git',
      branch: '',
      path: '',
    })
  })
})

describe('buildStartPrompt', () => {
  const kanban = getExample('kanban')!

  it('names the template and asks what you are building', () => {
    const prompt = buildStartPrompt(kanban)
    expect(prompt).toContain('Set up the Supabase "Kanban Board" template')
    expect(prompt).toContain("Ask me what I'm building")
  })

  it('sets up Supabase from the migrations and deploys to Vercel', () => {
    const prompt = buildStartPrompt(kanban)
    expect(prompt).toContain('git -C source sparse-checkout set examples/templates/kanban')
    expect(prompt).toContain('supabase db push')
    expect(prompt).toContain('VITE_SUPABASE_PUBLISHABLE_KEY')
    expect(prompt).toContain('vercel deploy')
  })
})
