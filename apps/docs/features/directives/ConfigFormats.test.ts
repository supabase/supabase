import { readFileSync } from 'fs'
import { join } from 'path'
import fg from 'fast-glob'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { describe, expect, it } from 'vitest'

import { codeTabsRemark } from './CodeTabs'
import { configFormatsRemark, convertConfigTomlToJsonc } from './ConfigFormats'
import { fromDocsMarkdown } from './utils.server'

async function render(mdx: string, { withCodeTabs = false } = {}) {
  let mdast = fromDocsMarkdown(mdx.trim())
  mdast = await configFormatsRemark()(mdast)
  if (withCodeTabs) mdast = codeTabsRemark()(mdast)
  return toMarkdown(mdast, { extensions: [mdxToMarkdown()] })
}

describe('ConfigFormats', () => {
  it('should render a standalone config.toml fence as ConfigCodeTabs', async () => {
    const output = await render(`
\`\`\`toml name=supabase/config.toml
[auth]
enabled = true
\`\`\`
`)

    expect(output).toEqual(
      `
<ConfigCodeTabs>
  <TabPanel id="supabase/config.toml" label="supabase/config.toml">
    \`\`\`toml
    [auth]
    enabled = true
    \`\`\`
  </TabPanel>

  <TabPanel id="supabase/config.jsonc" label="supabase/config.jsonc">
    \`\`\`jsonc
    {
      "auth": {
        "enabled": true
      }
    }
    \`\`\`
  </TabPanel>
</ConfigCodeTabs>
`.trimStart()
    )
  })

  it('should add a jsonc tab to a config.toml fence inside CodeTabs', async () => {
    const output = await render(
      `
<$CodeTabs>

\`\`\`toml name=supabase/config.toml
[auth]
enabled = true
\`\`\`

\`\`\`ts name=index.ts
console.log('hi')
\`\`\`

</$CodeTabs>
`,
      { withCodeTabs: true }
    )

    expect(output).toEqual(
      `
<CodeTabs>
  <TabPanel id="supabase/config.toml" label="supabase/config.toml">
    \`\`\`toml name=supabase/config.toml
    [auth]
    enabled = true
    \`\`\`
  </TabPanel>

  <TabPanel id="supabase/config.jsonc" label="supabase/config.jsonc">
    \`\`\`jsonc name=supabase/config.jsonc
    {
      "auth": {
        "enabled": true
      }
    }
    \`\`\`
  </TabPanel>

  <TabPanel id="index.ts" label="index.ts">
    \`\`\`ts name=index.ts
    console.log('hi')
    \`\`\`
  </TabPanel>
</CodeTabs>
`.trimStart()
    )
  })

  it('should wrap config.toml fences nested in lists', async () => {
    const output = await render(`
1. Edit the config:

   \`\`\`toml name=supabase/config.toml
   [auth]
   enabled = true
   \`\`\`
`)

    expect(output).toContain('<ConfigCodeTabs>')
    expect(output).toContain('```jsonc')
  })

  it('should leave unnamed and differently named TOML untouched', async () => {
    const mdx = `
\`\`\`toml
[auth]
enabled = true
\`\`\`

\`\`\`toml name=pyproject.toml
[tool.poetry]
name = "x"
\`\`\`
`.trim()

    expect(await render(mdx)).toEqual(
      toMarkdown(fromDocsMarkdown(mdx), { extensions: [mdxToMarkdown()] })
    )
  })

  it('should drop the generated $schema for snippets', async () => {
    const jsonc = await convertConfigTomlToJsonc('[auth]\nenabled = true\n')
    expect(jsonc).not.toContain('$schema')
  })

  it('should keep $schema when the source declares one', async () => {
    const jsonc = await convertConfigTomlToJsonc(
      '#:schema https://supabase.com/schemas/config/v1.json\n\n[auth]\nenabled = true\n'
    )
    expect(jsonc).toContain('"$schema"')
  })

  it('should carry comments, including commented-out keys', async () => {
    const jsonc = await convertConfigTomlToJsonc(
      '# Auth settings\n[auth]\nenabled = true\n# site_url = "http://localhost:3000"\n'
    )
    expect(jsonc).toContain('// Auth settings')
    expect(jsonc).toContain('// "site_url": "http://localhost:3000",')
  })

  it('should throw a useful error for an unconvertible snippet', async () => {
    await expect(convertConfigTomlToJsonc('\n[auth\nenabled = true\n')).rejects.toThrowError(
      /parse_error.*\[auth/s
    )
  })

  it('should convert every config.toml fence in the docs content', async () => {
    const contentDir = join(__dirname, '../../content')
    const files = await fg('**/*.mdx', { cwd: contentDir, absolute: true })
    const failures: Array<string> = []
    let converted = 0

    for (const file of files) {
      const source = readFileSync(file, 'utf-8')
      if (!source.includes('name=supabase/config.toml')) continue
      try {
        await configFormatsRemark()(fromDocsMarkdown(source))
        converted += (source.match(/name=supabase\/config\.toml/g) ?? []).length
      } catch (err) {
        failures.push(`${file}: ${(err as Error).message}`)
      }
    }

    expect(failures).toEqual([])
    expect(converted).toBeGreaterThan(0)
  })
})
