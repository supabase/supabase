import { describe, expect, it } from 'vitest'

import { resolveTemplateJsonRelativePaths } from './template-json'

describe('template JSON helpers', () => {
  it('resolves nested relative path strings against the template.json URL', () => {
    const templateJson = {
      name: 'automatic-embeddings',
      config: './config.toml',
      path: ['./functions/automatic-embeddings/index.ts', './functions/automatic-embeddings/config.toml'],
      files: [
        {
          source: './schemas/001-init.sql',
          target: 'supabase/migrations/001-init.sql',
        },
      ],
      docs: {
        install: {
          entrypoint: './README.md',
        },
      },
    }

    expect(
      resolveTemplateJsonRelativePaths(
        templateJson,
        'https://cdn.example.com/templates/automatic-embeddings/template.json'
      )
    ).toEqual({
      name: 'automatic-embeddings',
      config: 'https://cdn.example.com/templates/automatic-embeddings/config.toml',
      path: [
        'https://cdn.example.com/templates/automatic-embeddings/functions/automatic-embeddings/index.ts',
        'https://cdn.example.com/templates/automatic-embeddings/functions/automatic-embeddings/config.toml',
      ],
      files: [
        {
          source: 'https://cdn.example.com/templates/automatic-embeddings/schemas/001-init.sql',
          target: 'supabase/migrations/001-init.sql',
        },
      ],
      docs: {
        install: {
          entrypoint: 'https://cdn.example.com/templates/automatic-embeddings/README.md',
        },
      },
    })
  })

  it('leaves non-relative strings unchanged', () => {
    expect(
      resolveTemplateJsonRelativePaths(
        {
          path: [
            'https://cdn.example.com/templates/template.sql',
            '/absolute/on/consumer',
            'functions/without-dot-prefix.ts',
          ],
        },
        'https://cdn.example.com/templates/template.json'
      )
    ).toEqual({
      path: [
        'https://cdn.example.com/templates/template.sql',
        '/absolute/on/consumer',
        'functions/without-dot-prefix.ts',
      ],
    })
  })
})
