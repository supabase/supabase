#!/usr/bin/env node
// @ts-check

/**
 * Generates apps/studio/AGENTS.md from the canonical Studio skills in
 * .claude/skills/. The skills are the single source of truth; this file is a
 * derived artifact whose only consumer is CodeRabbit's code-guidelines feature,
 * which auto-detects `**\/AGENTS.md` and scopes a file to its own directory tree
 * (so `apps/studio/AGENTS.md` applies to `apps/studio/**`). Claude Code does NOT
 * read AGENTS.md, so this adds zero context cost there — Claude keeps using the
 * skills directly.
 *
 * Usage:
 *   node scripts/sync-studio-guidelines.mjs           # write apps/studio/AGENTS.md
 *   node scripts/sync-studio-guidelines.mjs --check    # exit 1 if the file is stale
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

// Ordered list of skills to inline. Keep this list self-contained: if a skill
// here references another via "See `x` skill", include `x` too so the reference
// resolves to a section within this document.
const SKILLS = [
  'studio-best-practices',
  'studio-ui-patterns',
  'vercel-composition-patterns',
  'studio-queries',
  'studio-error-handling',
]

const OUTPUT_PATH = join(repoRoot, 'apps/studio/AGENTS.md')

/**
 * Strip YAML frontmatter (a leading `---` ... `---` block) and trim.
 * @param {string} source
 * @returns {string}
 */
function stripFrontmatter(source) {
  if (!source.startsWith('---')) return source.trim()
  const end = source.indexOf('\n---', 3)
  if (end === -1) return source.trim()
  const after = source.indexOf('\n', end + 1)
  return source.slice(after + 1).trim()
}

function build() {
  const sections = SKILLS.map((name) => {
    const relPath = `.claude/skills/${name}/SKILL.md`
    const body = stripFrontmatter(readFileSync(join(repoRoot, relPath), 'utf8'))
    return `<!-- source: ${relPath} -->\n\n${body}`
  })

  const header = [
    '<!--',
    '  GENERATED FILE — DO NOT EDIT.',
    '',
    '  Source of truth: the Studio skills in .claude/skills/ (listed below).',
    '  Regenerate with: pnpm sync:guidelines',
    '  CI fails if this file drifts from the skills (studio-guidelines-sync workflow).',
    '',
    '  This file exists so CodeRabbit applies the Studio conventions when reviewing',
    '  apps/studio code. CodeRabbit auto-detects **/AGENTS.md and scopes it to this',
    '  directory tree. Claude Code does not read AGENTS.md and uses the skills directly.',
    '-->',
    '',
    '# Studio Code Review Guidelines',
    '',
    'Conventions for `apps/studio` code, compiled from the Studio skills. Apply these',
    'when reviewing changes under `apps/studio/`.',
  ].join('\n')

  return `${header}\n\n${sections.join('\n\n---\n\n')}\n`
}

const isCheck = process.argv.includes('--check')
const expected = build()

if (isCheck) {
  let actual = ''
  try {
    actual = readFileSync(OUTPUT_PATH, 'utf8')
  } catch {
    // missing file → stale
  }
  if (actual !== expected) {
    console.error(
      'apps/studio/AGENTS.md is out of date with the Studio skills.\n' +
        'Run `pnpm sync:guidelines` and commit the result.'
    )
    process.exit(1)
  }
  console.log('apps/studio/AGENTS.md is up to date.')
} else {
  writeFileSync(OUTPUT_PATH, expected)
  console.log(`Wrote apps/studio/AGENTS.md from ${SKILLS.length} skills.`)
}
