import { describe, expect, it } from 'vitest'

import type { ICommandSection } from '../internal/types'
import { sortSectionsByRelevance } from './sortSectionsByRelevance'

const section = (id: string, ...names: string[]): ICommandSection => ({
  id,
  name: id,
  commands: names.map((name) => ({ id: name, name, action: () => {} })),
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
})
