import { describe, expect, it, vi } from 'vitest'

import { createGitHubTemplateSource } from './github'

function createFetchFixture(files: Record<string, string>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const path = decodeURIComponent(new URL(url).pathname).split('/').slice(4).join('/')
    const content = files[path]

    if (content === undefined) {
      return new Response('Not found', { status: 404 })
    }

    return new Response(content, { status: 200 })
  }) as typeof fetch
}

describe('GitHub template source', () => {
  it('resolves included registry items and files relative to their registry file', async () => {
    const fetcher = createFetchFixture({
      'registry.json': JSON.stringify({
        include: ['templates/database/registry.json', 'templates/auth/registry.json'],
      }),
      'templates/database/registry.json': JSON.stringify({
        name: 'database',
        type: 'registry:item',
        title: 'Database',
        description: 'Database template',
        categories: ['Core'],
        files: [
          { path: 'supabase/config.toml', type: 'registry:file', target: '~/supabase/config.toml' },
        ],
        meta: { version: '1.0.0', defaultEnabled: true },
      }),
      'templates/database/supabase/config.toml': '[db]\nenabled = true\n',
      'templates/database/readme.md': '# Database readme',
      'templates/auth/registry.json': JSON.stringify({
        name: 'auth',
        type: 'registry:item',
        title: 'Auth',
        description: 'Auth template',
        categories: ['Auth'],
        registryDependencies: ['SaxonF/templates/database#v1.0.0'],
        files: [
          { path: 'supabase/config.toml', type: 'registry:file', target: '~/supabase/config.toml' },
        ],
        docs: '# Auth docs',
        meta: { version: '1.0.0' },
      }),
      'templates/auth/supabase/config.toml': '[auth]\nenabled = true\n',
    })

    const source = createGitHubTemplateSource({ fetcher })
    const templates = await source.listTemplates()

    expect(templates.map((template) => template.id)).toEqual(['database', 'auth'])
    expect(templates[0]).toMatchObject({
      id: 'database',
      defaultEnabled: true,
      readme: '# Database readme',
      files: [{ path: 'supabase/config.toml', content: '[db]\nenabled = true\n' }],
    })
    expect(templates[1]).toMatchObject({
      id: 'auth',
      readme: '# Auth docs',
      dependencies: { required: ['database'] },
    })
    expect(fetcher).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/SaxonF/templates/main/templates/database/supabase/config.toml',
      expect.any(Object)
    )
  })

  it('searches over template summaries from the loaded registry', async () => {
    const fetcher = createFetchFixture({
      'registry.json': JSON.stringify({
        items: [
          {
            name: 'rate-limits',
            type: 'registry:item',
            title: 'Rate limits',
            description: 'Application rate limit helpers',
            categories: ['Security'],
            files: [{ path: 'rate.sql', type: 'registry:file' }],
            meta: { version: '1.0.0', tags: ['security'] },
          },
        ],
      }),
      'rate.sql': 'select 1;\n',
    })

    const source = createGitHubTemplateSource({ fetcher })

    await expect(source.search?.({ text: 'limit' })).resolves.toEqual([
      expect.objectContaining({ id: 'rate-limits' }),
    ])
  })
})
