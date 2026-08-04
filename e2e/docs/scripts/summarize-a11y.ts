/**
 * Roll up per-surface axe results into a triage report.
 *
 * Emits Markdown for pasting into the Notion triage report, plus JSON for
 * cross-checking the numbers. Output is gitignored — the report lives in Notion.
 *
 *   pnpm -C e2e/docs run e2e:docs:a11y:summarize
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ENFORCED_RULES, type A11ySurfaceResult } from '../utils/axe-helpers.ts'

const E2E_DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const RESULTS_DIR = process.env.A11Y_RESULTS_DIR
  ? path.resolve(process.env.A11Y_RESULTS_DIR)
  : path.join(E2E_DOCS_ROOT, 'a11y-results')

const REPORT_DIR = process.env.A11Y_REPORT_DIR
  ? path.resolve(process.env.A11Y_REPORT_DIR)
  : path.join(E2E_DOCS_ROOT, 'a11y-report')

const TOP_PROBLEMS = 40

interface DistinctProblem {
  key: string
  ruleId: string
  impact: string
  help: string
  elements: number
  surfaces: number
  exampleSurface: string
  exampleHtml: string
  colorPair?: { fg: string; bg: string; ratio: number; expected: number }
  /** Coarse grouping hint, not a final family name. */
  signature: string
}

function readResults(): A11ySurfaceResult[] {
  let files: string[]
  try {
    files = readdirSync(RESULTS_DIR).filter((file) => file.endsWith('.json'))
  } catch {
    throw new Error(
      `No results directory at ${RESULTS_DIR}. Run a scan first, e.g.\n` +
        '  PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:a11y:all -- --workers=6'
    )
  }

  if (!files.length) throw new Error(`No result files in ${RESULTS_DIR}.`)

  return files.map((file) => JSON.parse(readFileSync(path.join(RESULTS_DIR, file), 'utf-8')))
}

/**
 * A lean article-scoped run and a complete full-page run measure different
 * things; merging them would understate contrast debt (excluded from one) and
 * overstate per-page debt (chrome counted in the other).
 */
function assertComparable(results: A11ySurfaceResult[]): void {
  const signatures = new Map<string, string[]>()

  for (const result of results) {
    const signature = `scope=${result.scope} excludedRules=[${[...result.excludedRules].sort().join(',')}]`
    const surfaces = signatures.get(signature) ?? []
    surfaces.push(result.surface)
    signatures.set(signature, surfaces)
  }

  if (signatures.size <= 1) return

  const detail = [...signatures.entries()]
    .map(
      ([signature, surfaces]) =>
        `  ${signature}\n    ${surfaces.slice(0, 3).join(', ')}${surfaces.length > 3 ? `, … (${surfaces.length} total)` : ''}`
    )
    .join('\n')

  throw new Error(
    `${RESULTS_DIR} mixes scans that are not comparable, so a combined report would be ` +
      `misleading:\n${detail}\n\nClear the directory and re-run a single mode.`
  )
}

/**
 * Collapse markup to its structural shape: text content and generated ids differ
 * on every page even when the failing element is one shared component.
 */
function normalizeHtml(html: string): string {
  return (
    html
      .toLowerCase()
      .replace(/>[^<]+</g, '><')
      .replace(
        /\b(id|for|aria-controls|aria-labelledby|aria-describedby|aria-activedescendant|data-state|data-radix[\w-]*|style|href|src|value)\s*=\s*"[^"]*"/g,
        '$1=""'
      )
      // Generated ids leak into attributes this doesn't blank wholesale.
      .replace(/radix-[\w-]+/g, 'radix-*')
      .replace(/:r[a-z0-9]+:/g, ':r*:')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300)
  )
}

function outermostTag(html: string): string {
  return html.match(/^<\s*([a-zA-Z][\w-]*)/)?.[1]?.toLowerCase() ?? 'unknown'
}

/**
 * Deliberately blunt — clusters by rule plus tag and role, which gets most
 * shared-component families into one bucket. Naming each family and pinning it to
 * a component or token is a human step over this ranking.
 */
function signatureFor(ruleId: string, html: string, colorFg?: string): string {
  if (colorFg) return `${ruleId}|fg:${colorFg}`
  const role = html.match(/\brole\s*=\s*"([^"]+)"/i)?.[1]?.toLowerCase()
  return `${ruleId}|${outermostTag(html)}${role ? `[role=${role}]` : ''}`
}

function contrastData(node: {
  any?: { id: string; data?: Record<string, unknown> }[]
}): DistinctProblem['colorPair'] | undefined {
  const check = node.any?.find((entry) => entry.id === 'color-contrast')
  const data = check?.data as
    | {
        fgColor?: string
        bgColor?: string
        contrastRatio?: number
        expectedContrastRatio?: string | number
      }
    | undefined
  if (!data?.fgColor || !data?.bgColor) return undefined

  return {
    fg: data.fgColor,
    bg: data.bgColor,
    ratio: Number(data.contrastRatio ?? 0),
    expected: Number.parseFloat(String(data.expectedContrastRatio ?? '0')),
  }
}

function buildDistinctProblems(results: A11ySurfaceResult[]): DistinctProblem[] {
  const problems = new Map<string, DistinctProblem & { surfaceSet: Set<string> }>()

  for (const result of results) {
    for (const violation of result.violations) {
      for (const node of violation.nodes) {
        const colors = contrastData(node)
        // Contrast keys on the color pair: one bad token is one problem however
        // many times text using it appears.
        const key = colors
          ? `${violation.id}|${colors.fg}|${colors.bg}|${colors.expected}`
          : `${violation.id}|${normalizeHtml(node.html)}`

        let problem = problems.get(key)
        if (!problem) {
          problem = {
            key,
            ruleId: violation.id,
            impact: violation.impact ?? 'unknown',
            help: violation.help,
            elements: 0,
            surfaces: 0,
            exampleSurface: result.surface,
            exampleHtml: node.html.slice(0, 400),
            colorPair: colors,
            signature: signatureFor(violation.id, node.html, colors?.fg),
            surfaceSet: new Set<string>(),
          }
          problems.set(key, problem)
        }

        problem.elements += 1
        problem.surfaceSet.add(result.surface)
      }
    }
  }

  return [...problems.values()]
    .map(({ surfaceSet, ...problem }) => ({ ...problem, surfaces: surfaceSet.size }))
    .sort((a, b) => b.elements - a.elements || a.ruleId.localeCompare(b.ruleId))
}

function mdTable(headers: string[], rows: (string | number)[][]): string {
  const escape = (cell: string | number) => String(cell).replace(/\|/g, '\\|')
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`),
  ].join('\n')
}

function main() {
  const results = readResults()
  assertComparable(results)

  const scope = results[0].scope
  const excludedRules = results[0].excludedRules
  const loaded = results.filter((result) => result.loaded)
  const failedToLoad = results.filter((result) => !result.loaded)
  const totalElements = loaded.reduce(
    (sum, result) => sum + result.violations.reduce((n, v) => n + v.nodes.length, 0),
    0
  )
  const cleanSurfaces = loaded.filter((result) => result.violations.length === 0)

  const byRule = new Map<
    string,
    { impact: string; help: string; elements: number; surfaces: Set<string> }
  >()
  for (const result of loaded) {
    for (const violation of result.violations) {
      const entry = byRule.get(violation.id) ?? {
        impact: violation.impact ?? 'unknown',
        help: violation.help,
        elements: 0,
        surfaces: new Set<string>(),
      }
      entry.elements += violation.nodes.length
      entry.surfaces.add(result.surface)
      byRule.set(violation.id, entry)
    }
  }
  const ruleRows = [...byRule.entries()]
    .sort((a, b) => b[1].elements - a[1].elements || a[0].localeCompare(b[0]))
    .map(([ruleId, entry]) => ({
      ruleId,
      impact: entry.impact,
      surfaces: entry.surfaces.size,
      elements: entry.elements,
      help: entry.help,
      enforced: ENFORCED_RULES.includes(ruleId),
    }))

  const byArea = new Map<string, { surfaces: Set<string>; elements: number }>()
  for (const result of loaded) {
    const entry = byArea.get(result.area) ?? { surfaces: new Set<string>(), elements: 0 }
    entry.surfaces.add(result.surface)
    entry.elements += result.violations.reduce((n, v) => n + v.nodes.length, 0)
    byArea.set(result.area, entry)
  }
  const areaRows = [...byArea.entries()]
    .sort((a, b) => b[1].elements - a[1].elements || a[0].localeCompare(b[0]))
    .map(([area, entry]) => ({ area, surfaces: entry.surfaces.size, elements: entry.elements }))

  const problems = buildDistinctProblems(loaded)

  const clusters = new Map<string, { elements: number; problems: number; ruleIds: Set<string> }>()
  for (const problem of problems) {
    const entry = clusters.get(problem.signature) ?? {
      elements: 0,
      problems: 0,
      ruleIds: new Set<string>(),
    }
    entry.elements += problem.elements
    entry.problems += 1
    entry.ruleIds.add(problem.ruleId)
    clusters.set(problem.signature, entry)
  }
  const clusterRows = [...clusters.entries()]
    .sort((a, b) => b[1].elements - a[1].elements)
    .map(([signature, entry]) => ({
      signature,
      elements: entry.elements,
      problems: entry.problems,
      share: totalElements ? Math.round((entry.elements / totalElements) * 1000) / 10 : 0,
    }))

  const topClusterCount = Math.min(12, clusterRows.length)
  const topClusterShare = clusterRows
    .slice(0, topClusterCount)
    .reduce((sum, cluster) => sum + cluster.elements, 0)

  const enforcedHits = ruleRows.filter((rule) => rule.enforced)

  const md: string[] = []
  md.push('# Docs a11y scan — axe-core WCAG 2.1 A/AA')
  md.push('')
  md.push(
    `- Mode: **${scope}** scope` +
      (excludedRules.length
        ? ` (excluded rules: ${excludedRules.join(', ')})`
        : ' (complete rule set)')
  )
  md.push(
    `- Surfaces scanned: **${loaded.length}**, of which **${cleanSurfaces.length}** are clean`
  )
  md.push(`- Failing elements: **${totalElements}**`)
  md.push(`- Distinct problems after dedup: **${problems.length}**`)
  if (totalElements) {
    md.push(
      `- Top ${topClusterCount} of ${clusterRows.length} clusters cover ` +
        `**${Math.round((topClusterShare / totalElements) * 100)}%** of failing elements`
    )
  }
  if (failedToLoad.length) {
    md.push(
      `- Surfaces that failed to load (not a11y findings): **${failedToLoad.length}** — ` +
        failedToLoad.map((r) => `${r.surface} (${r.status ?? 'no response'})`).join(', ')
    )
  }
  md.push(
    enforcedHits.length
      ? `- ⚠️ **Blocking rules with violations:** ${enforcedHits.map((r) => `${r.ruleId} (${r.elements})`).join(', ')}`
      : `- Blocking rules (${ENFORCED_RULES.join(', ')}) are at **zero**`
  )
  md.push('')

  md.push('## By rule')
  md.push('')
  md.push(
    mdTable(
      ['Rule', 'Impact', 'Surfaces', 'Elements', 'Blocking', 'What it means'],
      ruleRows.map((rule) => [
        rule.ruleId,
        rule.impact,
        rule.surfaces,
        rule.elements,
        rule.enforced ? 'yes' : '',
        rule.help,
      ])
    )
  )
  md.push('')

  md.push('## By docs area')
  md.push('')
  md.push(
    mdTable(
      ['Area', 'Surfaces', 'Elements'],
      areaRows.map((area) => [area.area, area.surfaces, area.elements])
    )
  )
  md.push('')

  md.push('## Clustering hints')
  md.push('')
  md.push(
    'Automatic grouping by rule plus element shape. These are starting points for naming ' +
      'root-cause families, not the families themselves — pinning each to a component or token ' +
      'is a manual step over this ranking.'
  )
  md.push('')
  md.push(
    mdTable(
      ['Signature', 'Distinct problems', 'Elements', '% of all'],
      clusterRows
        .slice(0, 20)
        .map((cluster) => [
          cluster.signature,
          cluster.problems,
          cluster.elements,
          `${cluster.share}%`,
        ])
    )
  )
  md.push('')

  md.push(`## Distinct problems (top ${Math.min(TOP_PROBLEMS, problems.length)})`)
  md.push('')
  md.push(
    mdTable(
      ['Rule', 'Impact', 'Elements', 'Surfaces', 'Detail', 'Example surface'],
      problems
        .slice(0, TOP_PROBLEMS)
        .map((problem) => [
          problem.ruleId,
          problem.impact,
          problem.elements,
          problem.surfaces,
          problem.colorPair
            ? `${problem.colorPair.fg} on ${problem.colorPair.bg} — ${problem.colorPair.ratio}:1, needs ${problem.colorPair.expected}:1`
            : `\`${problem.exampleHtml.replace(/\s+/g, ' ').slice(0, 160)}\``,
          problem.exampleSurface,
        ])
    )
  )
  md.push('')

  mkdirSync(REPORT_DIR, { recursive: true })
  const markdownPath = path.join(REPORT_DIR, 'summary.md')
  const jsonPath = path.join(REPORT_DIR, 'summary.json')

  writeFileSync(markdownPath, `${md.join('\n')}\n`)
  writeFileSync(
    jsonPath,
    `${JSON.stringify(
      {
        scope,
        excludedRules,
        surfacesScanned: loaded.length,
        surfacesClean: cleanSurfaces.length,
        surfacesFailedToLoad: failedToLoad.map((r) => ({ surface: r.surface, status: r.status })),
        totalElements,
        distinctProblems: problems.length,
        enforcedRulesWithViolations: enforcedHits.map((r) => ({
          ruleId: r.ruleId,
          elements: r.elements,
        })),
        byRule: ruleRows,
        byArea: areaRows,
        clusters: clusterRows,
        problems,
      },
      null,
      2
    )}\n`
  )

  console.error(
    `${loaded.length} surface(s), ${totalElements} failing element(s), ${problems.length} distinct problem(s).`
  )
  console.error(`Wrote ${markdownPath}`)
  console.error(`Wrote ${jsonPath}`)
}

main()
