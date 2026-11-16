import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { buildLlmsTxt, getDocFiles } from '../scripts/build-markdown-index'
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
      expect(docs).toEqual([
        {
          title: 'A title: with punctuation',
          description: 'A folded description across two lines',
          path: 'folded',
        },
        { title: 'Quoted title', description: 'A quoted description', path: 'quoted' },
      ])
      const output = buildLlmsTxt(docs, new Date('2026-09-11T00:00:00Z'))
      expect(output).toMatch(/folded.md\)/)
      expect(output).toMatch(/    - A folded description across two lines/)
      expect(output).toMatch(/    - A quoted description/)
      expect(output).not.toMatch(/>-|description:|'A quoted description'/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('uses the same slug coverage for the LLM index and Markdown pages', () => {
    const directory = fileURLToPath(new URL('../content/docs/', import.meta.url))
    const sources = collectMdxFiles(directory)
    const docs = getDocFiles(directory)
    expect(docs.map((doc) => doc.path)).toEqual(
      sources.map((source) => getDocSlug(path.relative(directory, source)))
    )
    expect(new Set(docs.map((doc) => doc.path)).size).toBe(docs.length)
    expect(getDocSlug('framework\\index.mdx')).toBe('framework')
    const aiChat = docs.find((doc) => doc.path === 'starters/ai-chat-app')!
    expect(aiChat.description).toBe(
      'A Next.js chat app with streaming responses, authentication, and saved conversations'
    )
    const output = buildLlmsTxt(docs)
    expect(output.includes('    - Local-first, reactive collections backed by Supabase')).toBe(true)
    expect(output).not.toMatch(/    - >-/)
  })

  it('rejects invalid metadata types rather than stringifying them into generated content', () => {
    expect(() => parseLibraryDocument('---\ntitle: [one, two]\n---')).toThrow(
      /title must be a string/
    )
    expect(() => parseLibraryDocument('---\ndescription: 42\n---')).toThrow(
      /description must be a string/
    )
    expect(() => parseLibraryDocument('---\npreview: true\n---')).toThrow(
      /preview must be a string/
    )
    const source = readFileSync(
      new URL('../content/docs/starters/ai-chat-app.mdx', import.meta.url),
      'utf8'
    )
    expect(parseLibraryDocument(source).content).toMatch(/npx create-next-app/)
  })
})
