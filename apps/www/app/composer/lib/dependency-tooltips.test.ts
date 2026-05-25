import { describe, expect, it } from 'vitest'

import { getDependencyTooltip } from './dependency-tooltips'
import type { Template } from './templates'

const templates: Template[] = [
  {
    id: 'database',
    name: 'Database',
    description: '',
    category: 'Core',
        version: '1.0.0',
    files: [],
  },
  {
    id: 'auth',
    name: 'Auth',
    description: '',
    category: 'Auth',
        version: '1.0.0',
    dependencies: { required: ['database'] },
    files: [],
  },
  {
    id: 'storage',
    name: 'Storage',
    description: '',
    category: 'Storage',
        version: '1.0.0',
    dependencies: { required: ['database'] },
    files: [],
  },
]

describe('getDependencyTooltip', () => {
  it('reports the requiring template when only one selected template needs it', () => {
    expect(getDependencyTooltip('database', new Set(['auth']), templates)).toBe('Required by Auth')
  })

  it('joins multiple requiring templates with commas', () => {
    expect(getDependencyTooltip('database', new Set(['auth', 'storage']), templates)).toBe(
      'Required by Auth, Storage'
    )
  })

  it('falls back to a generic message when no selected template lists the dependency', () => {
    expect(getDependencyTooltip('database', new Set(['storage']), templates)).toBe(
      'Required by Storage'
    )
    expect(getDependencyTooltip('database', new Set(), templates)).toBe('Included as a dependency')
  })
})
