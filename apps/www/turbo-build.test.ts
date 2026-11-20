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

function count(event: string) {
  return events().filter((e) => e === event).length
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

// Run the real pnpm scripts, maybe-turbo and Turbo binary/config. Only remote generators
// and Next compilation are fixture stand-ins.
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
// Tasks run in strict env mode, so the variables the fixture generators read to simulate remote
// content changes and failures are passed through like real credentials.
const passThrough = (task: { passThroughEnv?: string[] } | undefined, ...names: string[]) => ({
  ...task,
  passThroughEnv: [...(task?.passThroughEnv ?? []), ...names],
})
json('apps/www/turbo.json', {
  ...turboConfig,
  tasks: {
    ...turboConfig.tasks,
    'content:build:core': passThrough(turboConfig.tasks['content:build:core'], 'FIXTURE_CONTENT'),
    'content:build': passThrough(turboConfig.tasks['content:build'], 'FIXTURE_SKILLS'),
  },
})
// Mirrors the parts of apps/docs/turbo.jsonc that www's build depends on.
json('apps/docs/turbo.json', {
  extends: ['//'],
  tasks: {
    'build:federated-content': {
      cache: false,
      passThroughEnv: ['FIXTURE_DOCS', 'FIXTURE_FAIL_PREPARE'],
    },
    'build:guides-markdown': {
      dependsOn: ['build:federated-content'],
      inputs: ['$TURBO_DEFAULT$', { mode: 'jit', globs: ['content/guides/**'] }],
      outputs: ['public/markdown/guides/**'],
    },
  },
})
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
const deploymentArtifacts = [
  'apps/www/.next/static/chunk.js',
  'apps/www/public/rss.xml',
  'apps/www/public/customers-rss.xml',
  'apps/www/public/sitemap.xml',
  'apps/www/public/sitemap_www.xml',
  'apps/www/public/.well-known/agent-skills/index.json',
  'apps/docs/public/markdown/guides/example.md',
]

function missingArtifacts() {
  return deploymentArtifacts.filter((file) => !fs.existsSync(path.join(fixture, file)))
}
fs.symlinkSync(
  path.join(repoRoot, 'node_modules/.bin/turbo'),
  path.join(fixture, 'node_modules/.bin/turbo')
)
fs.symlinkSync(path.join(repoRoot, 'node_modules/turbo'), path.join(fixture, 'node_modules/turbo'))
fs.symlinkSync(
  path.join(repoRoot, 'packages/maybe-turbo/bin/maybe-turbo.mjs'),
  path.join(fixture, 'node_modules/.bin/maybe-turbo')
)

// Like the real repo, so inputs that exclude files still skip gitignored ones such as .next.
for (const args of [
  ['init', '--quiet'],
  ['add', '-A'],
  [
    '-c',
    'user.name=test',
    '-c',
    'user.email=test@example.com',
    'commit',
    '--quiet',
    '-m',
    'fixture',
  ],
]) {
  spawnSync('git', args, { cwd: fixture })
}

// The test process's own PATH locates the fixture's pnpm and turbo; it isn't a variable of any
// turbo task, so it's read through a copy to stay out of the turbo env lint rule.
const hostEnv = { ...process.env }

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
        ...hostEnv,
        CI: 'true',
        VERCEL_GIT_COMMIT_SHA: '1111111111111111111111111111111111111111',
        PATH: `${path.join(fixture, 'node_modules/.bin')}${path.delimiter}${hostEnv.PATH}`,
        ...env,
      },
    }
  )
  return { ...result, output: result.stdout + result.stderr }
}

afterAll(() => fs.rmSync(fixture, { recursive: true, force: true }))

describe('www deployment build lifecycle', () => {
  it('prepares content before compiling', () => {
    const result = build()
    expect(result.status, result.output).toBe(0)
    const log = events()
    // Content preparation runs in parallel tasks, but all of it finishes before compilation.
    expect([...log.slice(0, 3)].sort()).toEqual(['docs:fetch', 'docs:markdown', 'www:content'])
    expect(log.indexOf('docs:fetch')).toBeLessThan(log.indexOf('docs:markdown'))
    expect(log.slice(3)).toEqual(['compile', 'sitemap'])
    expect(missingArtifacts()).toEqual([])
  }, 90_000)

  it('restores compiled assets and sitemaps on a cache hit', () => {
    fs.rmSync(path.join(app, '.next'), { recursive: true, force: true })
    fs.rmSync(path.join(app, 'public'), { recursive: true, force: true })
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('cache hit')
    expect(count('compile')).toBe(1)
    // Remote content is refreshed on every build, even when the compilation is cached.
    expect(count('docs:fetch')).toBe(2)
    expect(count('www:content')).toBe(2)
    expect(count('docs:markdown')).toBe(1)
    expect(missingArtifacts()).toEqual([])
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
      const compiled = count('compile')
      const result = build(env)
      expect(result.status, result.output).toBe(0)
      expect(count('compile')).toBe(compiled + 1)
    },
    90_000
  )

  it('invalidates compilation when a shared package changes', () => {
    write('packages/common/index.js', 'export const version = 2\n')
    const compiled = count('compile')
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(count('compile')).toBe(compiled + 1)
  }, 90_000)

  it('invalidates compilation when a local environment file changes', () => {
    write('apps/www/.env.local', 'NEXT_PUBLIC_LOCAL_SETTING=changed\n')
    const compiled = count('compile')
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(count('compile')).toBe(compiled + 1)
  }, 90_000)

  it('invalidates compilation when the imported Studio component changes', () => {
    write('apps/studio/components/ui/TwoOptionToggle.tsx', 'export const version = 2\n')
    const compiled = count('compile')
    const result = build()
    expect(result.status, result.output).toBe(0)
    expect(count('compile')).toBe(compiled + 1)
  }, 90_000)

  it('also refreshes content through the root Turbo build', () => {
    const compiled = count('compile')
    const fetched = count('docs:fetch')
    const content = count('www:content')
    const result = build({}, true)
    expect(result.status, result.output).toBe(0)
    expect(count('compile')).toBe(compiled)
    expect(count('docs:fetch')).toBe(fetched + 1)
    expect(count('www:content')).toBe(content + 1)
  }, 90_000)

  it.each([{ FIXTURE_FAIL_PREPARE: '1' }, { NEXT_PUBLIC_FIXTURE_FAIL_BUILD: '1' }])(
    'fails the build when an earlier stage fails: %j',
    (env) => {
      const result = build(env)
      expect(result.status, result.output).not.toBe(0)
    },
    90_000
  )
})
