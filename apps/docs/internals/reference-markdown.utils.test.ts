import { describe, expect, it } from 'vitest'

import {
  proseToMarkdown,
  renderApiOperation,
  renderCliCommand,
  renderCliGlobalFlags,
  renderFamilyIndex,
  renderFunctionSection,
  renderRootIndex,
  type ApiSchema,
  type ReferenceFunction,
} from './reference-markdown.utils'

describe('proseToMarkdown', () => {
  it('unwraps layout components and keeps their prose', async () => {
    const out = await proseToMarkdown(`
<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

    Install the package.

  </RefSubLayout.Details>
</RefSubLayout.EducationRow>
`)
    expect(out).toBe('Install the package.')
  })

  it('labels tab panels and keeps their code fences', async () => {
    const out = await proseToMarkdown(`
<Tabs>
  <TabPanel id="npm" label="npm">

    \`\`\`sh Terminal
    npm install thing
    \`\`\`

  </TabPanel>
</Tabs>
`)
    expect(out).toBe('**npm**\n\n```sh Terminal\nnpm install thing\n```')
  })

  it('leaves JSX inside code fences alone', async () => {
    const fence = '```tsx\n<Admonition type="note">kept</Admonition>\n```'
    expect(await proseToMarkdown(fence)).toBe(fence)
  })

  it('renders admonitions the way the guides do', async () => {
    const out = await proseToMarkdown('<Admonition type="caution">\n\nBe careful.\n\n</Admonition>')
    expect(out).toBe('Caution: Be careful.')
  })

  it('unwraps a tag named like an Object.prototype key instead of calling it', async () => {
    expect(await proseToMarkdown('Before <constructor>inner</constructor> after.')).toBe(
      'Before inner after.'
    )
  })

  it('inlines $Partial includes', async () => {
    const out = await proseToMarkdown('<$Partial path="api_rate_limits.mdx" />')
    expect(out).toContain('## Rate limits')
  })

  it('renders the CLI global flags component from the flags it is given', async () => {
    const out = await proseToMarkdown('Intro.\n\n<CliGlobalFlagsHandler />', {
      cliFlags: [{ name: '--debug' }],
    })
    expect(out).toBe('Intro.\n\n### Flags\n\n- `--debug` (optional)')
  })

  it('turns an h1 into the title, keeps linked images, and drops decorative ones', async () => {
    const out = await proseToMarkdown(`
<img src="/icon.svg" />
<h1 className="text-3xl">Management API</h1>

<a href="https://example.com/releases">
  <img src="https://example.com/badge.svg" alt="latest version" />
</a>
`)
    expect(out).toBe(
      '# Management API\n\n[![latest version](https://example.com/badge.svg)](https://example.com/releases)'
    )
  })
})

describe('renderCliGlobalFlags', () => {
  it('treats a flag as optional unless it is marked required', () => {
    const out = renderCliGlobalFlags([
      { name: '--debug', description: 'output debug logs' },
      { name: '--yes', required: true },
    ])
    expect(out).toBe(
      '### Flags\n\n- `--debug` (optional)\n\n  output debug logs\n- `--yes` (required)'
    )
  })
})

describe('renderFunctionSection', () => {
  const types = {
    comment: {
      shortText: 'Perform a SELECT.',
      text: 'Longer explanation.',
      examples: [{ code: '```ts\ntypespec()\n```' }],
    },
    params: [{ name: 'columns' }],
  }

  const render = (fn: Partial<ReferenceFunction> = {}) =>
    renderFunctionSection({ title: 'select', fn: { id: 'select', ...fn }, types })

  it('orders TypeSpec text, then the authored description, then notes', () => {
    const out = render({ description: 'Authored description.', notes: 'A note.' })
    expect(out).toMatch(
      /Perform a SELECT\.[\s\S]*Longer explanation\.[\s\S]*Authored description\.[\s\S]*A note\./
    )
  })

  it('prefers overwriteParams, then authored params, then TypeSpec params', () => {
    const overwriteParams = [{ name: 'overwritten' }]
    const params = [{ name: 'authored' }]

    expect(render({ overwriteParams, params })).not.toContain('`authored`')
    expect(render({ params })).toContain('`authored`')
    expect(render({ params })).not.toContain('`columns`')
    expect(render()).toContain('`columns`')
  })

  it('uses TypeSpec examples only when there are no authored examples', () => {
    expect(render({ examples: [{ code: 'authored()' }] })).not.toContain('typespec()')
    expect(render({ examples: [] })).toContain('typespec()')
  })

  it('keeps example data, response, and notes', () => {
    const out = render({
      examples: [
        {
          code: 'upsert()',
          data: { sql: 'create table x();' },
          response: '{"data":[]}',
          description: 'A note.',
        },
      ],
    })
    expect(out).toContain('create table x();')
    expect(out).toContain('{"data":[]}')
    expect(out).toContain('A note.')
  })
})

describe('renderApiOperation', () => {
  it('renders the method, parameters, schemas, deprecation, plans, scopes, and permissions', () => {
    const out = renderApiOperation({
      endpoint: {
        summary: 'Create a project',
        method: 'post',
        path: '/v1/projects/{ref}',
        deprecated: true,
        'x-oauth-scope': 'projects:write',
        'x-allowed-plans': ['pro'],
        'x-fga-permissions': [['a_create'], ['b_create', 'b_admin']],
        parameters: [{ name: 'ref', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', description: 'Project name' },
                  plan: { type: 'string', deprecated: true, enum: ['free', 'pro'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
          },
          '403': {},
        },
      },
    })

    expect(out).toContain('# Create a project (deprecated)')
    expect(out).toContain('`POST /v1/projects/{ref}`')
    expect(out).toContain('### Path parameters\n\n- `ref` (string, required)')
    expect(out).toContain('- `name` (string, required): Project name')
    expect(out).toContain('- `plan` (string, optional, deprecated) Values: `free`, `pro`.')
    expect(out).toContain('### OAuth scopes\n\n- `projects:write`')
    expect(out).toContain('### Available on plans\n\n- `pro`')
    expect(out).toContain('- `a_create`\n\nor\n\n- `b_create`\n- `b_admin`')
    expect(out).toContain('### Response codes\n\n- `201`\n- `403`')
    expect(out).toContain('### Response (201)\n\n- `id` (string, optional)')
  })

  it('reads the request body from a legacy `in: body` parameter', () => {
    const out = renderApiOperation({
      endpoint: {
        parameters: [
          { name: 'body', in: 'body', schema: { properties: { q: { type: 'string' } } } },
        ],
      },
    })
    expect(out).toContain('### Request body\n\n- `q` (string')
  })

  it('names the type, and keeps the description, of array items and union variants that are not objects', () => {
    const out = renderApiOperation({
      endpoint: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                properties: {
                  domains: { type: 'array', items: { type: 'string' } },
                  size: { oneOf: [{ type: 'number' }, { type: 'string', enum: ['auto'] }] },
                  body: { anyOf: [{ type: 'string', description: 'The raw body.' }] },
                },
              },
            },
          },
        },
      },
    })

    expect(out).toContain('- `domains` (array, optional)\n  - Array of:\n    - string')
    expect(out).toContain('  - One of:\n    - number\n    - string. Values: `auto`.')
    expect(out).toContain('    - string: The raw body.')
  })

  it('keeps every paragraph of a description inside its list item', () => {
    const out = renderApiOperation({
      endpoint: {
        parameters: [
          {
            name: 'reveal',
            in: 'query',
            schema: { type: 'string' },
            description: 'Boolean string.\n\nTruthy values: `true`',
          },
        ],
      },
    })
    expect(out).toContain(
      '- `reveal` (string, optional): Boolean string.\n\n  Truthy values: `true`'
    )
  })

  it('omits the type of a parameter whose schema is a union, instead of guessing string', () => {
    const out = renderApiOperation({
      endpoint: {
        parameters: [
          {
            name: 'id_or_ref',
            in: 'path',
            required: true,
            schema: { anyOf: [{ type: 'number' }] },
          },
        ],
      },
    })
    expect(out).toContain('- `id_or_ref` (required)')
  })

  it('stops on circular schemas and names $ref targets instead of expanding them', () => {
    const node: ApiSchema = { type: 'object' }
    node.properties = { child: node, ref: { $ref: '#/components/schemas/Node' } }

    const out = renderApiOperation({
      endpoint: { responses: { '200': { content: { 'application/json': { schema: node } } } } },
    })

    expect(out).toContain('See `Node`')
    expect(out).toContain('_(nested schema omitted)_')
  })
})

describe('renderCliCommand', () => {
  it('renders usage, flags, and examples, and links subcommands it can title', () => {
    const out = renderCliCommand({
      command: {
        id: 'supabase-db',
        title: 'supabase db',
        usage: 'supabase db [command]',
        subcommands: ['supabase-db-push', 'supabase-db-untitled'],
        flags: [{ name: '--linked' }],
        examples: [{ code: 'supabase db push', response: 'done' }],
      },
      subcommandTitles: { 'supabase-db-push': 'supabase db push' },
    })

    expect(out).toContain('```sh\nsupabase db [command]\n```')
    expect(out).toContain('- `--linked` (optional)')
    expect(out).toContain('##### Response\n\ndone')
    expect(out).toContain('[supabase db push](/docs/reference/cli/supabase-db-push)')
    expect(out).not.toContain('supabase-db-untitled')
  })
})

describe('renderFamilyIndex', () => {
  const sections = [{ slug: 'select', title: 'select()' }, { slug: 'insert' }]

  it('links the current version without a version segment and lists older versions', () => {
    const out = renderFamilyIndex({
      name: 'JavaScript',
      libPath: 'javascript',
      version: 'v2',
      versions: ['v2', 'v1'],
      sections,
    })
    expect(out).toBe(
      [
        '# JavaScript reference v2',
        '- [select()](/docs/reference/javascript/select.md)\n- [insert](/docs/reference/javascript/insert.md)',
        '## Other versions',
        '- [v1](/docs/reference/javascript/v1.md)',
      ].join('\n\n')
    )
  })

  it('links an older version with its segment and points back to the current one', () => {
    const out = renderFamilyIndex({
      name: 'JavaScript',
      libPath: 'javascript',
      version: 'v1',
      versions: ['v2', 'v1'],
      sections,
    })
    expect(out).toContain('(/docs/reference/javascript/v1/select.md)')
    expect(out).toContain('- [v2](/docs/reference/javascript.md)')
  })

  it('omits versions for an unversioned family', () => {
    const out = renderFamilyIndex({
      name: 'CLI',
      libPath: 'cli',
      version: 'latest',
      versions: [],
      sections,
    })
    expect(out).toBe(
      '# CLI reference\n\n- [select()](/docs/reference/cli/select.md)\n- [insert](/docs/reference/cli/insert.md)'
    )
  })
})

describe('renderRootIndex', () => {
  it('links each family index', () => {
    expect(renderRootIndex([{ name: 'CLI', libPath: 'cli' }])).toBe(
      '# Supabase reference\n\n- [CLI](/docs/reference/cli.md)'
    )
  })
})
