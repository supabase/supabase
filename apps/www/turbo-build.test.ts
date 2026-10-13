import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import { afterAll, describe, expect, it } from 'vitest'

const wwwRoot = process.cwd()
const repoRoot = path.resolve(wwwRoot, '../..')
const packageJson = JSON.parse(fs.readFileSync(path.join(wwwRoot, 'package.json'), 'utf8'))
const turboConfig = ts.parseConfigFileTextToJson(
  'turbo.jsonc',
  fs.readFileSync(path.join(wwwRoot, 'turbo.jsonc'), 'utf8')
).config
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'www-turbo-'))
const app = path.join(fixture, 'apps/www')

function write(file: string, content: string) {
  const target = path.join(fixture, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}

function json(file: string, value: unknown) {
  write(file, JSON.stringify(value))
}

function executable(file: string, content: string) {
  write(file, `#!/usr/bin/env node\n${content}`)
  fs.chmodSync(path.join(fixture, file), 0o755)
}

function events() {
  return fs.readFileSync(path.join(fixture, '.checks/events'), 'utf8').trim().split('\n')
}

const helpers = `
const fs = require('node:fs');
const path = require('node:path');
const root = ${JSON.stringify(fixture)};
const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
};
const event = (value) => fs.appendFileSync(path.join(root, '.checks/events'), value + '\\n');
`

// Run the real pnpm lifecycle, Turbo binary/config, and uploader. Only remote
// generators, Next compilation, and the aws executable are fixture stand-ins.
json('package.json', { name: 'fixture', private: true, packageManager: 'pnpm@11.13.1' })
write('pnpm-workspace.yaml', 'packages:\n  - apps/*\n  - packages/*\n')
write(
  '.gitignore',
  'node_modules\n.turbo\n.next\n.generated\n.checks\npublic\ncontent\n*.generated.ts\n.env*\n'
)
write(
  'pnpm-lock.yaml',
  "lockfileVersion: '9.0'\nimporters:\n  .: {}\n  apps/www: {}\n  apps/docs: {}\n  packages/common: {}\n"
)
json('turbo.json', {
  tasks: { build: { dependsOn: ['^build'] } },
  remoteCache: { enabled: false },
})
json('apps/www/package.json', {
  name: 'www',
  private: true,
  scripts: packageJson.scripts,
  dependencies: { common: 'workspace:*' },
})
json('apps/www/turbo.json', turboConfig)
json('apps/docs/package.json', {
  name: 'docs',
  private: true,
  scripts: {
    'build:federated-content': 'node fetch.cjs',
    'build:guides-markdown': 'node markdown.cjs',
  },
})
json('packages/common/package.json', { name: 'common', private: true })
write('packages/common/index.js', 'export const version = 1\n')
write('apps/studio/components/ui/TwoOptionToggle.tsx', 'export const version = 1\n')
write('.checks/events', '')
write(
  'apps/docs/fetch.cjs',
  helpers +
    `
event('docs:fetch');
if (process.env.FIXTURE_FAIL_PREPARE) process.exit(1);
write('content/guides/example.mdx', process.env.FIXTURE_DOCS || 'docs-v1');
`
)
write(
  'apps/docs/markdown.cjs',
  helpers +
    `
event('docs:markdown');
write('public/markdown/guides/example.md', fs.readFileSync('content/guides/example.mdx'));
`
)
const generateContent =
  helpers +
  `
event('www:content');
const content = process.env.FIXTURE_CONTENT || 'content-v1';
for (const file of ['.generated/staticContent/_index.json', 'public/rss.xml', 'public/changelog-rss.xml', 'public/changelog.md', 'public/changelog/entry.md']) write(file, content);
`
write(
  'apps/www/scripts/generateStaticContent.mjs',
  `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);\n${generateContent}`
)
write(
  'apps/www/scripts/generateMdContent.mjs',
  `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);\n${helpers}
write('app/api-v2/md/content.generated.ts', fs.readFileSync('.generated/staticContent/_index.json'));
`
)
write(
  'apps/www/scripts/fetchAgentSkills.mjs',
  `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);\n${helpers}
write('public/.well-known/agent-skills/index.json', process.env.FIXTURE_SKILLS || 'skills-v1');
`
)
write(
  'apps/www/internals/generate-sitemap.mjs',
  `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);\n${helpers}
event('sitemap');
write('public/sitemap.xml', 'sitemap');
write('public/sitemap_www.xml', 'www-sitemap');
`
)
executable(
  'node_modules/.bin/next',
  helpers +
    `
event('compile');
if (process.env.NEXT_PUBLIC_FIXTURE_FAIL_BUILD) process.exit(1);
const content = fs.readFileSync('.generated/staticContent/_index.json', 'utf8');
const docs = fs.readFileSync('../docs/public/markdown/guides/example.md', 'utf8');
write('.next/server/page.html', content + docs);
write('.next/static/chunk.js', content + docs);
write('.next/cache/temporary', 'not a deploy artifact');
write('public/customers-rss.xml', content);
`
)
executable(
  'node_modules/.bin/aws',
  helpers +
    `
event('upload:' + process.argv[4]);
if (!fs.existsSync('.next/static/chunk.js')) throw new Error('Upload is missing restored static assets');
for (const file of ['public/rss.xml', 'public/customers-rss.xml', 'public/sitemap.xml', 'public/sitemap_www.xml', 'public/.well-known/agent-skills/index.json', '../docs/public/markdown/guides/example.md']) {
  if (!fs.existsSync(file)) throw new Error('Missing deployment artifact: ' + file);
}
`
)
write(
  'scripts/upload-static-assets.sh',
  fs.readFileSync(path.join(repoRoot, 'scripts/upload-static-assets.sh'), 'utf8')
)
fs.chmodSync(path.join(fixture, 'scripts/upload-static-assets.sh'), 0o755)
fs.symlinkSync(
  path.join(repoRoot, 'node_modules/.bin/turbo'),
  path.join(fixture, 'node_modules/.bin/turbo')
)
fs.symlinkSync(path.join(repoRoot, 'node_modules/turbo'), path.join(fixture, 'node_modules/turbo'))

function build(env: Partial<NodeJS.ProcessEnv> = {}, rootCommand = false) {
  const command = rootCommand ? path.join(fixture, 'node_modules/.bin/turbo') : 'pnpm'
  const result = spawnSync(
    command,
    rootCommand ? ['run', 'build', '--filter=www'] : ['run', 'build'],
    {
      cwd: rootCommand ? fixture : app,
      encoding: 'utf8',
      timeout: 60_000,
      env: {
        ...process.env,
        CI: 'true',
        FORCE_ASSET_CDN: '1',
        VERCEL_ENV: 'preview',
        VERCEL_GIT_COMMIT_SHA: '1111111111111111111111111111111111111111',
        SITE_NAME: 'www',
        ASSET_CDN_S3_ENDPOINT: 'https://example.invalid',
        PATH: `${path.join(fixture, 'node_modules/.bin')}${path.delimiter}${process.env.PATH}`,
        ...env,
      },
    }
  )
  return { ...result, output: result.stdout + result.stderr }
}

afterAll(() => fs.rmSync(fixture, { recursive: true, force: true }))

describe('www deployment build lifecycle', () => {
  it('builds fresh artifacts before uploading them', () => {
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(events()).toEqual([
      'docs:fetch',
      'docs:markdown',
      'www:content',
      'compile',
      'sitemap',
      'upload:.next/static',
      'upload:public',
    ])
    expect(fs.existsSync(path.join(app, '.next/static/chunk.js'))).toBe(false)
  }, 90_000)

  it('restores compiled assets and sitemaps and still uploads on a cache hit', () => {
    fs.rmSync(path.join(app, '.next'), { recursive: true, force: true })
    fs.rmSync(path.join(app, 'public'), { recursive: true, force: true })
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('cache hit')
    expect(events().filter((event) => event === 'compile')).toHaveLength(1)
    expect(events().filter((event) => event === 'docs:fetch')).toHaveLength(2)
    expect(events().filter((event) => event.startsWith('upload:'))).toHaveLength(4)
    expect(fs.existsSync(path.join(app, '.next/cache/temporary'))).toBe(false)
  }, 90_000)

  it.each([
    { FIXTURE_CONTENT: 'content-v2' },
    { FIXTURE_DOCS: 'docs-v2' },
    { FIXTURE_SKILLS: 'skills-v2' },
    { NEXT_PUBLIC_NEW_SETTING: 'new-value' },
    { VERCEL_GIT_COMMIT_SHA: '2222222222222222222222222222222222222222' },
  ])(
    'invalidates compilation when an input changes: %j',
    (env) => {
      const count = events().filter((event) => event === 'compile').length
      const result = build(env)
      expect(result.status, result.output).toBe(0)
      expect(events().filter((event) => event === 'compile')).toHaveLength(count + 1)
    },
    90_000
  )

  it('invalidates compilation when a shared package changes', () => {
    write('packages/common/index.js', 'export const version = 2\n')
    const count = events().filter((event) => event === 'compile').length
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(events().filter((event) => event === 'compile')).toHaveLength(count + 1)
  }, 90_000)

  it('invalidates compilation when a local environment file changes', () => {
    write('apps/www/.env.local', 'NEXT_PUBLIC_LOCAL_SETTING=changed\n')
    const count = events().filter((event) => event === 'compile').length
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(events().filter((event) => event === 'compile')).toHaveLength(count + 1)
  }, 90_000)

  it('invalidates compilation when the imported Studio component changes', () => {
    write('apps/studio/components/ui/TwoOptionToggle.tsx', 'export const version = 2\n')
    const count = events().filter((event) => event === 'compile').length
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(events().filter((event) => event === 'compile')).toHaveLength(count + 1)
  }, 90_000)

  it('also refreshes content and uploads through the root Turbo build', () => {
    const count = events().filter((event) => event === 'compile').length
    const result = build({}, true)
    expect(result.status, result.output).toBe(0)
    expect(events().filter((event) => event === 'compile')).toHaveLength(count)
    expect(events().slice(-5)).toEqual([
      'docs:fetch',
      'docs:markdown',
      'www:content',
      'upload:.next/static',
      'upload:public',
    ])
  }, 90_000)

  it.each([{ FIXTURE_FAIL_PREPARE: '1' }, { NEXT_PUBLIC_FIXTURE_FAIL_BUILD: '1' }])(
    'does not upload after an earlier build stage fails: %j',
    (env) => {
      const uploads = events().filter((event) => event.startsWith('upload:')).length
      const result = build(env)
      expect(result.status, result.output).not.toBe(0)
      expect(events().filter((event) => event.startsWith('upload:'))).toHaveLength(uploads)
    },
    90_000
  )
})
