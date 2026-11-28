import { readFileSync } from 'node:fs'
import { type BundledLanguage } from 'shiki'
import { describe, expect, it } from 'vitest'

import { highlightCode } from './CodeBlock.highlight'
import { getCodeBlockLabel, getCopyText, getTokenClassName } from './CodeBlock.tokens'
import theme from './supabase-2.json' with { type: 'json' }

const themeColors = (): Array<string> => {
  const colors = new Set<string>()

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (node === null || typeof node !== 'object') return

    for (const [key, value] of Object.entries(node)) {
      if ((key === 'foreground' || key === 'background') && typeof value === 'string') {
        colors.add(value)
      }
      walk(value)
    }
  }

  walk(theme)
  return [...colors]
}

describe('token class names', () => {
  it('maps every theme color to a class', () => {
    const colors = themeColors()
    expect(colors.length).toBeGreaterThan(0)

    const css = readFileSync(`${import.meta.dirname}/code-block.css`, 'utf8')
    for (const color of colors) {
      expect(getTokenClassName(color, 0), `${color} is missing from the class table`).toMatch(
        /^s-[a-z]$/
      )
      expect(css).toContain(`.shiki .${getTokenClassName(color, 0)} {\n  color: ${color};`)
    }
  })

  it('appends font style classes', () => {
    expect(getTokenClassName('var(--code-token-comment)', 1)).toBe('s-c s-i')
    expect(getTokenClassName(undefined, 2 | 4)).toBe('s-b s-l')
    expect(getTokenClassName(undefined, 0)).toBeUndefined()
    expect(getTokenClassName(undefined, -1)).toBeUndefined()
  })
})

describe('code block labels', () => {
  it('names language aliases and singular or plural line counts', () => {
    expect(getCodeBlockLabel('ts', 1)).toBe('TypeScript, 1 line')
    expect(getCodeBlockLabel('sh', 2)).toBe('Shell, 2 lines')
    expect(getCodeBlockLabel('rust', 3)).toBe('rust, 3 lines')
    expect(getCodeBlockLabel(null, 1)).toBe('1 line')
  })
})

describe('copy text', () => {
  it.each<{ name: string; lang: BundledLanguage; code: string; expected: string }>([
    {
      name: 'drops comments and jsdoc but keeps directives',
      lang: 'ts',
      code: [
        '/// <reference types="vite/client" />',
        '// @deno-types="npm:@types/express@^4.17"',
        "import express from 'npm:express'",
        '',
        '/**',
        ' * Starts the server.',
        ' * @param port the port',
        ' */',
        "const url = 'https://example.com' // your project url",
        '',
        '// step 2',
        'const port = 3000',
      ].join('\n'),
      expected: [
        '/// <reference types="vite/client" />',
        '// @deno-types="npm:@types/express@^4.17"',
        "import express from 'npm:express'",
        '',
        "const url = 'https://example.com'",
        '',
        'const port = 3000',
      ].join('\n'),
    },
    {
      name: 'keeps one blank line where a comment sat between two',
      lang: 'sql',
      code: 'select 1;\n\n-- OR\n\nselect 2; -- inline',
      expected: 'select 1;\n\nselect 2;',
    },
    {
      name: 'keeps the shebang and comment markers in strings',
      lang: 'bash',
      code: '#!/bin/bash\n# install\necho "# not a comment"',
      expected: '#!/bin/bash\necho "# not a comment"',
    },
    {
      name: 'copies markdown in full',
      lang: 'markdown',
      code: '# Title\n\n```ts\n// keep\n```',
      expected: '# Title\n\n```ts\n// keep\n```',
    },
    {
      name: 'copies a block of only comments in full',
      lang: 'toml',
      code: '# [auth]\n# enabled = true',
      expected: '# [auth]\n# enabled = true',
    },
    {
      name: 'keeps the indent of the first line',
      lang: 'yaml',
      code: '  nested: true # note\n  other: 2',
      expected: '  nested: true\n  other: 2',
    },
    {
      name: 'treats a line of spaces as blank',
      lang: 'bash',
      code: 'echo hi\n  \n# note\n\necho bye',
      expected: 'echo hi\n\necho bye',
    },
    {
      name: 'drops a line of spaces left at the start',
      lang: 'yaml',
      code: '# header\n  \nfoo: 1',
      expected: 'foo: 1',
    },
    {
      name: 'keeps the astro frontmatter fences',
      lang: 'astro',
      code: '---\nimport a from "a"\n// note\n---\n<p>hi</p>',
      expected: '---\nimport a from "a"\n---\n<p>hi</p>',
    },
  ])(
    '$name',
    async ({ lang, code, expected }) => {
      const { tokens } = await highlightCode(code, lang)

      expect(getCopyText({ code, lang, tokens })).toBe(expected)
    },
    // the real highlighter loads every grammar on the first call
    30_000
  )
})
