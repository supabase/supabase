import { describe, expect, it } from 'vitest'

import { filterTemplates } from './template-filter'
import type { Template } from './templates'

const templates: Template[] = [
  {
    id: 'auth-otp',
    name: 'Auth OTP',
    description: 'One-time password login flow',
    category: 'Auth',
    tags: ['otp', 'magic-link'],
    files: [],
  },
  {
    id: 'storage',
    name: 'Storage',
    description: 'S3 compatible bucket storage',
    category: 'Storage',
    tags: ['s3', 'files'],
    files: [],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'PostHog events pipeline',
    category: 'Observability',
    files: [],
  },
]

describe('filterTemplates', () => {
  it('returns all templates for empty search', () => {
    expect(filterTemplates(templates, '')).toHaveLength(3)
    expect(filterTemplates(templates, '   ')).toHaveLength(3)
  })

  it('matches by name (case-insensitive)', () => {
    expect(filterTemplates(templates, 'STORAGE').map((t) => t.id)).toEqual(['storage'])
  })

  it('matches by description', () => {
    expect(filterTemplates(templates, 'posthog').map((t) => t.id)).toEqual(['analytics'])
  })

  it('matches by id', () => {
    expect(filterTemplates(templates, 'auth-otp').map((t) => t.id)).toEqual(['auth-otp'])
  })

  it('matches by tag', () => {
    expect(filterTemplates(templates, 's3').map((t) => t.id)).toEqual(['storage'])
    expect(filterTemplates(templates, 'magic-link').map((t) => t.id)).toEqual(['auth-otp'])
  })

  it('returns empty array on no match', () => {
    expect(filterTemplates(templates, 'graphql')).toEqual([])
  })

  it('does not crash for templates without tags', () => {
    expect(filterTemplates(templates, 'analytics').map((t) => t.id)).toEqual(['analytics'])
  })
})
