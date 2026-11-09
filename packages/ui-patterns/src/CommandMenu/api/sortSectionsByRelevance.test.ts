import { describe, expect, it } from 'vitest'

import type { ICommandSection } from '../internal/types'
import { sortSectionsByRelevance } from './sortSectionsByRelevance'

const section = (id: string, ...names: string[]): ICommandSection => ({
  id,
  name: id,
  commands: names.map((name) => ({ id: name, name, action: () => {} })),
})

const grouped = (id: string, priority: number, ...names: string[]): ICommandSection => ({
  ...section(id, ...names),
  meta: { relevanceGroup: 'entities', priority },
})

const ids = (sections: readonly ICommandSection[]) => sections.map((s) => s.id)

describe('sortSectionsByRelevance', () => {
  it('puts the section with the best matching command first', () => {
    const sections = [
      section('actions', 'Configure organization...', 'Switch project...'),
      section('database', 'View and create functions'),
      section('integrations', 'View and manage your Cron Jobs'),
    ]

    expect(ids(sortSectionsByRelevance(sections, 'cron'))[0]).toBe('integrations')
  })

  it('keeps the registered order when there is no query or nothing separates the sections', () => {
    const sections = [section('a', 'Alpha'), section('b', 'Beta')]

    expect(ids(sortSectionsByRelevance(sections, ''))).toEqual(['a', 'b'])
    expect(ids(sortSectionsByRelevance(sections, 'zzz'))).toEqual(['a', 'b'])
  })

  describe('relevance groups', () => {
    it('keeps sections in a group ordered by priority even when a later one scores higher', () => {
      const sections = [
        grouped('policies', 3, 'blog_posts_owner_delete'),
        grouped('tables', 2, 'public.blog_posts'),
      ]

      expect(ids(sortSectionsByRelevance(sections, 'blog_posts'))).toEqual(['tables', 'policies'])
    })

    it('ranks the group by its best section and keeps it contiguous', () => {
      const sections = [
        section('integrations', 'View and manage your Cron Jobs'),
        grouped('tables', 2, 'public.cron_runs'),
        section('actions', 'Switch project...'),
        grouped('policies', 3, 'cron_runs_owner_delete'),
      ]

      expect(ids(sortSectionsByRelevance(sections, 'cron_runs_owner'))).toEqual([
        'tables',
        'policies',
        'integrations',
        'actions',
      ])
    })

    it('still lets other sections outrank the whole group', () => {
      const sections = [
        grouped('tables', 2, 'public.blog_posts'),
        grouped('policies', 3, 'blog_posts_owner_delete'),
        section('integrations', 'View and manage your Cron Jobs'),
      ]

      expect(ids(sortSectionsByRelevance(sections, 'cron'))[0]).toBe('integrations')
    })
  })
})
