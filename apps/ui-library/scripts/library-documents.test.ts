import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { buildLlmsTxt, getDocFiles } from './build-llms-txt'
import { collectMdxFiles, getDocSlug, parseLibraryDocument } from './library-documents'

describe('library document exports', () => {
  it('decodes YAML folded and quoted metadata for the LLM index', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'library-documents-'))
    try {
      mkdirSync(path.join(directory, 'folded'))
      writeFileSync(
        path.join(directory, 'folded', 'index.mdx'),
        `---
title: "A title: with punctuation"
description: >-
  A folded description
  across two lines
---

Body
`
      )
      writeFileSync(
        path.join(directory, 'quoted.mdx'),
        `---
title: 'Quoted title'
description: 'A quoted description'
---
`
      )
      const docs = getDocFiles(directory)
      assert.deepEqual(docs, [
        {
          title: 'A title: with punctuation',
          description: 'A folded description across two lines',
          path: 'folded',
        },
        { title: 'Quoted title', description: 'A quoted description', path: 'quoted' },
      ])
      const output = buildLlmsTxt(docs, new Date('2026-09-11T00:00:00Z'))
      assert.match(output, /folded.md\)/)
      assert.match(output, /    - A folded description across two lines/)
      assert.match(output, /    - A quoted description/)
      assert.doesNotMatch(output, />-|description:|'A quoted description'/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('uses the same slug coverage for the LLM index and Markdown pages', () => {
    const directory = fileURLToPath(new URL('../content/docs/', import.meta.url))
    const sources = collectMdxFiles(directory)
    const docs = getDocFiles(directory)
    assert.deepEqual(
      docs.map((doc) => doc.path),
      sources.map((source) => getDocSlug(path.relative(directory, source)))
    )
    assert.equal(new Set(docs.map((doc) => doc.path)).size, docs.length)
    assert.equal(getDocSlug('framework\\index.mdx'), 'framework')
    const aiChat = docs.find((doc) => doc.path === 'starters/ai-chat-app')!
    assert.equal(
      aiChat.description,
      'A Next.js chat app with streaming responses, authentication, and saved conversations'
    )
    const output = buildLlmsTxt(docs)
    assert.ok(output.includes('    - Local-first, reactive collections backed by Supabase'))
    assert.doesNotMatch(output, /    - >-/)
  })

  it('rejects invalid metadata types rather than stringifying them into generated content', () => {
    assert.throws(
      () => parseLibraryDocument('---\ntitle: [one, two]\n---'),
      /title must be a string/
    )
    assert.throws(
      () => parseLibraryDocument('---\ndescription: 42\n---'),
      /description must be a string/
    )
    assert.throws(() => parseLibraryDocument('---\npreview: true\n---'), /preview must be a string/)
    const source = readFileSync(
      new URL('../content/docs/starters/ai-chat-app.mdx', import.meta.url),
      'utf8'
    )
    assert.match(parseLibraryDocument(source).content, /npx create-next-app/)
  })
})
