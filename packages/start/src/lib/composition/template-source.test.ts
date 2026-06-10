import { templateIndex } from 'templates'
import { describe, expect, it } from 'vitest'

import { createStartTemplateSource, parseTemplateIndex } from './template-source'
import { mockTemplates } from '../template-catalog'

describe('start template source', () => {
  it('parses repository template indexes with templates arrays', () => {
    expect(
      parseTemplateIndex({
        templates: [
          {
            id: 'database',
            name: 'Database',
            description: 'Database template',
            category: 'Core',
            version: '1.0.0',
            tags: ['database'],
            defaultEnabled: true,
            dependencies: {
              required: ['auth'],
              optional: ['analytics'],
            },
            files: [{ path: 'supabase/config.toml', content: '[db]\nenabled = true\n' }],
          },
        ],
      })
    ).toEqual([
      {
        id: 'database',
        name: 'Database',
        description: 'Database template',
        category: 'Core',
        version: '1.0.0',
        tags: ['database'],
        defaultEnabled: true,
        dependencies: {
          required: ['auth'],
          optional: ['analytics'],
        },
        files: [{ path: 'supabase/config.toml', content: '[db]\nenabled = true\n' }],
      },
    ])
  })

  it('rejects invalid repository template indexes before they reach start', () => {
    expect(() => parseTemplateIndex({ templates: [{ id: 'missing-fields' }] })).toThrow(
      'Template field "name" must be a non-empty string'
    )
  })

  it('parses the generated package index used for public distribution', () => {
    expect(parseTemplateIndex(templateIndex)).toEqual(templateIndex.templates)
  })

  it('uses the package templates as the local fallback source', async () => {
    const previousIndexUrl = process.env.START_TEMPLATE_INDEX_URL

    delete process.env.START_TEMPLATE_INDEX_URL

    try {
      await expect(createStartTemplateSource().listTemplates()).resolves.toEqual(
        mockTemplates
      )
    } finally {
      if (previousIndexUrl === undefined) {
        delete process.env.START_TEMPLATE_INDEX_URL
      } else {
        process.env.START_TEMPLATE_INDEX_URL = previousIndexUrl
      }
    }
  })
})
