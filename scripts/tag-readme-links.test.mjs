import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { isInScope, tagMarkdown, tagUrl } from './tag-readme-links.mjs'

const FILE = 'examples/todo-list/nextjs-todo-list/README.md'
const CONTENT = 'utm_content=examples/todo-list/nextjs-todo-list/README.md'
const TAG = `utm_source=supabase&${CONTENT}`

const tag = (text, filePath = FILE) => tagMarkdown(text, { filePath })

test('tags the destination of an inline link', () => {
  const { text, added } = tag('[Dashboard](https://supabase.com/dashboard)')
  assert.equal(text, `[Dashboard](https://supabase.com/dashboard?${TAG})`)
  assert.equal(added, 1)
})

test('keeps existing params and puts ours before the fragment', () => {
  const { text } = tag('[x](https://supabase.com/dashboard/project/_?showConnect=true#section)')
  assert.equal(
    text,
    `[x](https://supabase.com/dashboard/project/_?showConnect=true&${TAG}#section)`
  )
})

test('tags www.supabase.com and a bare host with a trailing slash', () => {
  assert.equal(
    tag('[x](https://www.supabase.com/pricing)').text,
    `[x](https://www.supabase.com/pricing?${TAG})`
  )
  assert.equal(tag('[x](https://supabase.com)').text, `[x](https://supabase.com/?${TAG})`)
})

test('wraps a bare URL so the visible text stays the same', () => {
  assert.equal(
    tag('Sign up at https://supabase.com/dashboard.').text,
    `Sign up at [https://supabase.com/dashboard](https://supabase.com/dashboard?${TAG}).`
  )
})

test('replaces angle-bracket autolinks with a link that has the same text', () => {
  assert.equal(
    tag('<https://supabase.com/dashboard>').text,
    `[https://supabase.com/dashboard](https://supabase.com/dashboard?${TAG})`
  )
})

test('only tags the href when the link text is the URL', () => {
  assert.equal(
    tag('[https://supabase.com/dashboard](https://supabase.com/dashboard)').text,
    `[https://supabase.com/dashboard](https://supabase.com/dashboard?${TAG})`
  )
})

test('tags HTML hrefs and reference-style definitions', () => {
  assert.equal(
    tag('<a href="https://supabase.com/docs">Docs</a>').text,
    `<a href="https://supabase.com/docs?${TAG}">Docs</a>`
  )
  assert.equal(
    tag('[docs]: https://supabase.com/docs').text,
    `[docs]: https://supabase.com/docs?${TAG}`
  )
})

test('refreshes a stale utm_content and leaves other params alone', () => {
  const { text, refreshed, added } = tag(
    '[x](https://supabase.com/dashboard?a=1&utm_source=supabase&utm_content=old/README.md&b=2)'
  )
  assert.equal(text, `[x](https://supabase.com/dashboard?a=1&utm_source=supabase&${CONTENT}&b=2)`)
  assert.equal(refreshed, 1)
  assert.equal(added, 0)
})

test('adds a missing utm_content to a link that already has our utm_source', () => {
  assert.equal(
    tag('[x](https://supabase.com/docs?utm_source=supabase)').text,
    `[x](https://supabase.com/docs?utm_source=supabase&${CONTENT})`
  )
})

test('is idempotent', () => {
  const once = tag('[x](https://supabase.com/dashboard) and https://supabase.com/docs').text
  const twice = tag(once)
  assert.equal(twice.text, once)
  assert.equal(twice.unchanged, 2)
  assert.equal(twice.added + twice.refreshed, 0)
})

test('follows a file when it moves', () => {
  const before = tag('[x](https://supabase.com/dashboard)', 'examples/a/README.md').text
  const after = tagMarkdown(before, { filePath: 'examples/b/README.md' })
  assert.equal(
    after.text,
    '[x](https://supabase.com/dashboard?utm_source=supabase&utm_content=examples/b/README.md)'
  )
  assert.equal(after.refreshed, 1)
})

test('leaves links that someone else already tagged', () => {
  const input = '[x](https://supabase.com/docs?utm_source=newsletter&utm_medium=email)'
  const { text, foreign } = tag(input)
  assert.equal(text, input)
  assert.equal(foreign, 1)
  const lone = '[x](https://supabase.com/docs?utm_content=hero)'
  assert.equal(tag(lone).text, lone)
})

test('supports a custom repo name', () => {
  assert.equal(
    tagMarkdown('[x](https://supabase.com/docs)', { repo: 'cli', filePath: 'README.md' }).text,
    '[x](https://supabase.com/docs?utm_source=cli&utm_content=README.md)'
  )
})

test('encodes characters that would break a markdown link or URL', () => {
  const { text } = tag('[x](https://supabase.com/docs)', 'examples/my app/(beta)/README.md')
  assert.equal(
    text,
    '[x](https://supabase.com/docs?utm_source=supabase&utm_content=examples/my%20app/%28beta%29/README.md)'
  )
})

test('skips fenced code blocks and inline code', () => {
  const input = [
    '```bash',
    'curl https://supabase.com/docs',
    '```',
    '~~~~',
    '[x](https://supabase.com/docs)',
    '```',
    '~~~~',
    'Run `open https://supabase.com/dashboard` first',
    '',
    '``https://supabase.com/docs``',
  ].join('\n')
  const { text, added } = tag(input)
  assert.equal(text, input)
  assert.equal(added, 0)
})

test('resumes tagging after a code block closes', () => {
  const { text } = tag('```\nx\n```\n[x](https://supabase.com/docs)')
  assert.equal(text, `\`\`\`\nx\n\`\`\`\n[x](https://supabase.com/docs?${TAG})`)
})

test('skips images, src attributes and non-page assets', () => {
  const input = [
    '![logo](https://supabase.com/images/logo.png)',
    '<img src="https://supabase.com/dashboard/preview" width="10">',
    '[download](https://supabase.com/install.sh)',
  ].join('\n')
  assert.equal(tag(input).text, input)
})

test('tags the link around an image but not the image', () => {
  assert.equal(
    tag('[![badge](https://supabase.com/badge)](https://supabase.com/docs)').text,
    `[![badge](https://supabase.com/badge)](https://supabase.com/docs?${TAG})`
  )
})

test('skips URLs inside link text and HTML text nodes', () => {
  const input = [
    '[see https://supabase.com/docs for more](https://example.com)',
    '<a href="https://example.com">https://supabase.com</a>',
  ].join('\n')
  assert.equal(tag(input).text, input)
})

test('skips other hosts, subdomains and look-alikes', () => {
  const input = [
    '[x](https://discord.supabase.com)',
    '[x](https://supabase.com.evil.test/docs)',
    '[x](https://notsupabase.com/docs)',
    '[x](https://web.archive.org/web/2020/https://supabase.com/docs)',
    'mail someone@supabase.com',
  ].join('\n')
  assert.equal(tag(input).text, input)
})

test('skips URLs with placeholders', () => {
  const input = [
    '[x](https://supabase.com/dashboard/project/[ref]/settings)',
    '[x](https://supabase.com/dashboard/project/<ref>/settings)',
    '[x](https://supabase.com/dashboard/project/{ref}/settings)',
  ].join('\n')
  assert.equal(tag(input).text, input)
})

test('keeps CRLF line endings', () => {
  assert.equal(
    tag('a\r\n[x](https://supabase.com/docs)\r\n').text,
    `a\r\n[x](https://supabase.com/docs?${TAG})\r\n`
  )
})

test('tagUrl reports why a URL was left alone', () => {
  assert.equal(tagUrl('https://supabase.com/a.png', { filePath: 'README.md' }).status, 'skipped')
  assert.equal(
    tagUrl('https://supabase.com/a?utm_source=x', { filePath: 'README.md' }).status,
    'foreign'
  )
})

test('only the intended files are in scope', () => {
  for (const file of [
    'README.md',
    'CONTRIBUTING.md',
    'DEVELOPERS.md',
    'examples/auth/hono/README.md',
    'examples/README.MD',
    'docker/README.md',
    'docker/CONFIG.md',
    'apps/studio/README.md',
    'packages/ui/README.md',
  ]) {
    assert.ok(isInScope(file), file)
  }
  for (const file of [
    'AGENTS.md',
    'i18n/README.ja.md',
    'docker/CHANGELOG.md',
    'docker/.env.example',
    'apps/studio/components/README.md',
    'apps/docs/spec/README.md',
    'e2e/docs/README.md',
    'examples/prompts/README.md',
    'examples/prompts/use-realtime.md',
    'examples/auth/hono/src/client.tsx',
    'examples/slack-clone/CHANGELOG.md',
  ]) {
    assert.ok(!isInScope(file), file)
  }
})

// End-to-end: run the real CLI inside a throwaway git repository.
const SCRIPT = fileURLToPath(new URL('./tag-readme-links.mjs', import.meta.url))
const LINK = '[Dashboard](https://supabase.com/dashboard)'

function withTempRepo(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tag-readme-links-'))
  try {
    execFileSync('git', ['init', '-q'], { cwd: root })
    const write = (file, content) => {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      fs.writeFileSync(path.join(root, file), content)
    }
    const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
    const git = (...args) => execFileSync('git', args, { cwd: root })
    const cli = (...args) =>
      spawnSync(process.execPath, [SCRIPT, ...args], { cwd: root, encoding: 'utf8' })
    return run({ root, write, read, git, cli })
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

const tagged = (file) =>
  `[Dashboard](https://supabase.com/dashboard?utm_source=supabase&utm_content=${file})`

test('CLI: tags a link, then refreshes it after the file is moved with git mv', () => {
  withTempRepo(({ write, read, git, cli }) => {
    write('examples/a/README.md', `${LINK}\n`)
    git('add', '.')

    assert.equal(cli().status, 0)
    assert.equal(read('examples/a/README.md'), `${tagged('examples/a/README.md')}\n`)

    git('mv', 'examples/a', 'examples/b')
    const stale = cli('--check')
    assert.equal(stale.status, 1, 'a moved file should be reported as out of date')
    assert.match(stale.stderr, /examples\/b\/README\.md/)

    assert.equal(cli().status, 0)
    assert.equal(read('examples/b/README.md'), `${tagged('examples/b/README.md')}\n`)
    assert.equal(cli('--check').status, 0, 'a second run should find nothing to do')
  })
})

test('CLI: refreshes a link after a plain rename that has not been staged', () => {
  withTempRepo(({ root, write, read, git, cli }) => {
    write('examples/a/README.md', `${LINK}\n`)
    git('add', '.')
    assert.equal(cli().status, 0)

    // Rename on disk only: the index still lists the old path and the new one is untracked.
    fs.renameSync(path.join(root, 'examples/a'), path.join(root, 'examples/b'))

    const result = cli()
    assert.equal(result.status, 0, result.stderr)
    assert.equal(read('examples/b/README.md'), `${tagged('examples/b/README.md')}\n`)
  })
})

test('CLI: a deleted file does not break the run', () => {
  withTempRepo(({ root, write, git, cli }) => {
    write('README.md', `${LINK}\n`)
    write('examples/a/README.md', `${LINK}\n`)
    git('add', '.')
    fs.rmSync(path.join(root, 'examples/a'), { recursive: true })

    const result = cli('--check')
    assert.equal(result.status, 1, 'the remaining untagged README should still be reported')
    assert.doesNotMatch(result.stderr, /ENOENT/)
  })
})

test('CLI: files ignored by git are left alone', () => {
  withTempRepo(({ write, read, cli }) => {
    write('.gitignore', 'examples/ignored/\n')
    write('examples/ignored/README.md', `${LINK}\n`)

    assert.equal(cli().status, 0)
    assert.equal(read('examples/ignored/README.md'), `${LINK}\n`)
  })
})
