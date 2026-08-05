/**
 * Runs the `audit-docs-ia` skill (github.com/supabase/docs-agent-skills) against this
 * apps/docs checkout and prints a JSON report of information-architecture issues.
 *
 * Only the read-only, code-grounded phases of the skill are in scope here (nav map,
 * duplication, relationship classification, agent-surface). Phases that require an
 * Obsidian vault, a competitive benchmark, or stakeholder consensus are skipped — those
 * are out of scope for an automated run, and the skill file itself gates them behind
 * human sign-off.
 *
 * Requires OPENAI_API_KEY in apps/docs/.env.local (the only LLM credential this project
 * has configured).
 *
 * docs-agent-skills is a private repo: this script `git clone`s it over HTTPS, so it
 * needs a git credential (credential helper / cached token) that can already read it.
 * `--pr` instead authenticates as the docs GitHub App (DOCS_GITHUB_APP_ID,
 * DOCS_GITHUB_APP_INSTALLATION_ID, DOCS_GITHUB_APP_PRIVATE_KEY — the same app
 * apps/docs/lib/octokit.ts uses for federated content), which needs write access
 * (contents + pull requests) on docs-agent-skills for both the `git push` and the PR
 * creation call.
 *
 * `pnpm run build:federated-content` (wired up as this script's pre-task) fetches
 * federated guide content before evidence gathering runs, so those pages already exist
 * under content/guides/ and get scanned like any other guide content below — no
 * special-casing needed for federated sources.
 *
 * Run from apps/docs:
 *   pnpm run experimental:audit-ia             # print JSON report to stdout
 *   pnpm run experimental:audit-ia --report    # also write it to scripts/reports/<UTC date>-docs-ia-audit.json
 *   pnpm run experimental:audit-ia --pr        # also open a PR adding the report to
 *                                              # .claude/skills/audit-docs-ia/reports/ upstream
 */

import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { createAppAuth } from '@octokit/auth-app'
import { OpenAI } from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import _configureDotEnv from './utils/dotenv.js'

const _ = _configureDotEnv

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCS_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(__dirname, '../../..')
const SKILL_REPO_OWNER = 'supabase'
const SKILL_REPO_NAME = 'docs-agent-skills'
const SKILL_REPO_URL = `https://github.com/${SKILL_REPO_OWNER}/${SKILL_REPO_NAME}.git`
const SKILL_REPO_DEFAULT_BRANCH = 'main'
const SKILL_PATH = '.claude/skills/audit-docs-ia'
const MODEL = 'gpt-4.1'

// ---------------------------------------------------------------------------
// Skill download — shallow, sparse clone of the private docs-agent-skills repo.
// ---------------------------------------------------------------------------

interface SkillBundle {
  commit: string
  skillMd: string
  referenceDocs: Record<string, string>
}

// Only the reference docs the read-only phases in scope here actually need —
// vault-routing, consensus-gate and competitive-benchmark describe human/vault
// process that has no bearing on a JSON issues report.
const REFERENCE_FILES = [
  'navigation-audit.md',
  'duplication-audit.md',
  'relationship-rubric.md',
  'scoring-rubric.md',
  'agent-surface.md',
]

function downloadSkill(): SkillBundle {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-docs-ia-'))

  try {
    try {
      execFileSync(
        'git',
        ['clone', '--depth', '1', '--filter=blob:none', '--sparse', SKILL_REPO_URL, tmpDir],
        { stdio: ['ignore', 'ignore', 'pipe'] }
      )
    } catch (error) {
      fail(
        `Could not clone ${SKILL_REPO_URL}. It's a private repo — check that git can already ` +
          `authenticate to it (credential helper / cached token) and that "git" is on PATH.\n${describeError(error)}`
      )
    }

    try {
      execFileSync('git', ['sparse-checkout', 'set', SKILL_PATH], { cwd: tmpDir, stdio: 'pipe' })
    } catch (error) {
      fail(`Could not sparse-checkout "${SKILL_PATH}".\n${describeError(error)}`)
    }

    let commit: string
    try {
      commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmpDir, encoding: 'utf-8' }).trim()
    } catch (error) {
      fail(`Could not resolve the cloned commit SHA.\n${describeError(error)}`)
    }

    const skillDir = path.join(tmpDir, SKILL_PATH)

    let skillMd: string
    try {
      skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8')
    } catch (error) {
      fail(
        `Could not read SKILL.md at ${SKILL_PATH} — the audit-docs-ia skill layout may have ` +
          `changed upstream.\n${describeError(error)}`
      )
    }

    const referenceDocs: Record<string, string> = {}
    for (const file of REFERENCE_FILES) {
      try {
        referenceDocs[file] = fs.readFileSync(path.join(skillDir, 'reference', file), 'utf-8')
      } catch (error) {
        fail(
          `Could not read reference/${file} — the audit-docs-ia skill layout may have changed ` +
            `upstream.\n${describeError(error)}`
        )
      }
    }

    return { commit, skillMd, referenceDocs }
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch (error) {
      console.error(`Warning: could not clean up ${tmpDir}: ${describeError(error)}`)
    }
  }
}

// ---------------------------------------------------------------------------
// PR — pushes the report to a branch of docs-agent-skills and opens a PR
// adding it under .claude/skills/audit-docs-ia/reports/. Authenticates as the
// docs GitHub App (the same one apps/docs/lib/octokit.ts uses), not a personal token.
// ---------------------------------------------------------------------------

async function requestInstallationAuth(appId: string, installationId: string, privateKey: string) {
  try {
    return await createAppAuth({ appId, installationId, privateKey })({ type: 'installation' })
  } catch (error) {
    fail(
      `Could not get an installation access token for installation ${installationId}.\n${describeError(error)}`
    )
  }
}

async function getInstallationToken(): Promise<string> {
  const appId = process.env.DOCS_GITHUB_APP_ID
  const installationId = process.env.DOCS_GITHUB_APP_INSTALLATION_ID
  const privateKey = process.env.DOCS_GITHUB_APP_PRIVATE_KEY

  if (!appId || !installationId || !privateKey) {
    fail(
      'DOCS_GITHUB_APP_ID, DOCS_GITHUB_APP_INSTALLATION_ID, and DOCS_GITHUB_APP_PRIVATE_KEY are ' +
        'all required to open a PR. Add them to apps/docs/.env.local (this is the same GitHub ' +
        'App used for fetching federated content).'
    )
  }

  // GitHub Apps hand out PKCS#1 keys; @octokit/auth-app's JWT signing needs PKCS#8.
  // https://github.com/gr2m/universal-github-app-jwt?tab=readme-ov-file#converting-pkcs1-to-pkcs8
  let privateKeyPkcs8: string
  try {
    privateKeyPkcs8 = crypto
      .createPrivateKey(privateKey)
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()
  } catch (error) {
    fail(`Could not parse DOCS_GITHUB_APP_PRIVATE_KEY.\n${describeError(error)}`)
  }

  const auth = await requestInstallationAuth(appId, installationId, privateKeyPkcs8)

  if (auth.repositorySelection === 'selected' && !auth.repositoryNames?.includes(SKILL_REPO_NAME)) {
    fail(
      `The docs GitHub App installation (${installationId}) doesn't have access to ` +
        `${SKILL_REPO_OWNER}/${SKILL_REPO_NAME} — it's scoped to: ${(auth.repositoryNames ?? []).join(', ') || '(none)'}. ` +
        `Add the repo to the installation to open a PR.`
    )
  }
  if (auth.permissions.contents !== 'write' || auth.permissions.pull_requests !== 'write') {
    fail(
      `The docs GitHub App installation (${installationId}) doesn't have contents+pull_requests ` +
        `write permission on ${SKILL_REPO_OWNER}/${SKILL_REPO_NAME} (has: ${JSON.stringify(auth.permissions)}).`
    )
  }

  return auth.token
}

async function openReportPr(json: string, fileName: string, issueCount: number): Promise<string> {
  const token = await getInstallationToken()
  const authedRepoUrl = `https://x-access-token:${token}@github.com/${SKILL_REPO_OWNER}/${SKILL_REPO_NAME}.git`

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-docs-ia-pr-'))
  const branch = `docs-ia-audit-report-${utcTimestamp()}`

  try {
    try {
      execFileSync(
        'git',
        ['clone', '--depth', '1', '--filter=blob:none', '--sparse', authedRepoUrl, tmpDir],
        { stdio: ['ignore', 'ignore', 'pipe'] }
      )
    } catch (error) {
      fail(
        `Could not clone ${SKILL_REPO_URL} to open the PR using the docs GitHub App's ` +
          `installation token.\n${describeError(error)}`
      )
    }

    try {
      execFileSync('git', ['sparse-checkout', 'set', SKILL_PATH], { cwd: tmpDir, stdio: 'pipe' })
    } catch (error) {
      fail(`Could not sparse-checkout "${SKILL_PATH}" to open the PR.\n${describeError(error)}`)
    }

    try {
      execFileSync('git', ['checkout', '-b', branch], { cwd: tmpDir, stdio: 'pipe' })
    } catch (error) {
      fail(`Could not create branch "${branch}".\n${describeError(error)}`)
    }

    const reportRelativePath = path.posix.join(SKILL_PATH, 'reports', fileName)
    const reportAbsolutePath = path.join(tmpDir, reportRelativePath)
    try {
      fs.mkdirSync(path.dirname(reportAbsolutePath), { recursive: true })
      fs.writeFileSync(reportAbsolutePath, json)
    } catch (error) {
      fail(
        `Could not write the report into the clone at ${reportAbsolutePath}.\n${describeError(error)}`
      )
    }

    try {
      execFileSync('git', ['add', reportRelativePath], { cwd: tmpDir, stdio: 'pipe' })
      execFileSync(
        'git',
        ['commit', '-m', `audit-docs-ia: add report ${fileName} (${issueCount} issue(s))`],
        { cwd: tmpDir, stdio: 'pipe' }
      )
    } catch (error) {
      fail(`Could not commit the report.\n${describeError(error)}`)
    }

    try {
      execFileSync('git', ['push', '-u', 'origin', branch], { cwd: tmpDir, stdio: 'pipe' })
    } catch (error) {
      fail(
        `Could not push branch "${branch}" using the docs GitHub App's installation token.\n${describeError(error)}`
      )
    }

    let response: Response
    try {
      response = await fetch(
        `https://api.github.com/repos/${SKILL_REPO_OWNER}/${SKILL_REPO_NAME}/pulls`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            title: `audit-docs-ia: report ${fileName}`,
            head: branch,
            base: SKILL_REPO_DEFAULT_BRANCH,
            body:
              `Automated \`audit-docs-ia\` run against supabase/supabase apps/docs — ` +
              `${issueCount} issue(s) found, all \`status: hypothesis\` per the skill's consensus gate ` +
              `(see reference/consensus-gate.md).`,
          }),
        }
      )
    } catch (error) {
      fail(
        `Branch "${branch}" was pushed, but the GitHub API request to open the PR failed.\n${describeError(error)}`
      )
    }

    if (!response.ok) {
      fail(
        `Branch "${branch}" was pushed, but opening the PR failed: ${response.status} ${await response.text()}`
      )
    }

    const pr = await response.json()
    return pr.html_url as string
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch (error) {
      console.error(`Warning: could not clean up ${tmpDir}: ${describeError(error)}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Evidence gathering — mechanical translation of the `rg`/`ls` commands the
// skill's reference docs specify, run against the live apps/docs checkout.
// ---------------------------------------------------------------------------

interface Evidence {
  navConstantsExcerpt: string
  guideSections: string[]
  duplicateGuideUrls: Array<{ url: string; occurrences: number }>
  harnessSensitiveMdxFiles: string[]
}

function grepLines(content: string, pattern: RegExp): string[] {
  return content.split('\n').filter((line) => pattern.test(line))
}

function walkFiles(root: string, extension: string): string[] {
  const results: string[] = []
  const stack = [root]
  while (stack.length) {
    const dir = stack.pop()!
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        results.push(full)
      }
    }
  }
  return results
}

function gatherEvidence(): Evidence {
  const navConstantsPath = path.join(
    DOCS_ROOT,
    'components/Navigation/NavigationMenu/NavigationMenu.constants.ts'
  )
  let navContent: string
  try {
    navContent = fs.readFileSync(navConstantsPath, 'utf-8')
  } catch (error) {
    fail(
      `Could not read nav constants at ${navConstantsPath} — has the file moved?\n${describeError(error)}`
    )
  }

  const navConstantsExcerpt = [
    ...grepLines(navContent, /label: '/),
    ...grepLines(navContent, /url: '\/guides\//),
    ...grepLines(navContent, /enabled:/),
    ...grepLines(navContent, /export const \w+Nav/),
  ].join('\n')

  const urlCounts = new Map<string, number>()
  for (const match of navContent.matchAll(/url: '(\/guides\/[^']+)'/g)) {
    urlCounts.set(match[1], (urlCounts.get(match[1]) ?? 0) + 1)
  }
  const duplicateGuideUrls = [...urlCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url, occurrences]) => ({ url, occurrences }))

  const guidesDir = path.join(DOCS_ROOT, 'content/guides')
  let guideSections: string[]
  try {
    guideSections = fs
      .readdirSync(guidesDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
  } catch (error) {
    fail(
      `Could not list guide sections at ${guidesDir} — has the directory moved?\n${describeError(error)}`
    )
  }

  const harnessPattern = /quickstarts|ai-tools\/mcp|ai-tools\/plugins/
  let harnessSensitiveMdxFiles: string[]
  try {
    harnessSensitiveMdxFiles = walkFiles(guidesDir, '.mdx')
      .filter((file) => harnessPattern.test(fs.readFileSync(file, 'utf-8')))
      .map((file) => path.relative(REPO_ROOT, file))
  } catch (error) {
    fail(
      `Could not scan apps/docs/content/guides for harness-sensitive MDX.\n${describeError(error)}`
    )
  }

  return {
    navConstantsExcerpt,
    guideSections,
    duplicateGuideUrls,
    harnessSensitiveMdxFiles,
  }
}

// ---------------------------------------------------------------------------
// Issue schema — doubles as the OpenAI structured-output schema (via
// zodResponseFormat) and the shape of the final report.
// ---------------------------------------------------------------------------

const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['navigation', 'duplication', 'relationship', 'agent-surface', 'off-nav']),
  urls: z.array(z.string()),
  flags: z.array(
    z.enum(['catch-all', 'duplication', 'surface-mismatch', 'off-nav-candidate', 'harness-locked'])
  ),
  relationship: z.enum(['integrator', 'operator', 'contributor', 'mixed']).nullable(),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  visibility: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  effort: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  priority_score: z.number(),
  disposition: z.enum(['merge', 'cross-link', 'relabel', 'move', 'defer']),
  tier: z.enum(['mvp', 'q4', 'deferred']),
  harness_risk: z.enum(['none', 'low', 'high']),
  status: z.literal('hypothesis'),
})

const ReportPayloadSchema = z.object({ issues: z.array(IssueSchema) })

// ---------------------------------------------------------------------------
// Prompt assembly — the skill file already carries the instructions and
// process; we just hand it the evidence and note what doesn't apply headless.
// ---------------------------------------------------------------------------

function buildSystemPrompt(skill: SkillBundle): string {
  const docs = [skill.skillMd, ...Object.values(skill.referenceDocs)].join('\n\n---\n\n')
  return (
    `Follow this skill's own instructions for the navigation, duplication, relationship, ` +
    `and agent-surface phases only. There is no Obsidian vault or human reviewer available, ` +
    `so skip vault publishing, the manifest workflow, and consensus gates — report every ` +
    `finding as status "hypothesis" instead.\n\n${docs}`
  )
}

function buildUserPrompt(evidence: Evidence): string {
  return `Evidence gathered from the live supabase/supabase repo (apps/docs):\n\n${JSON.stringify(evidence, null, 2)}`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function fail(message: string): never {
  throw new Error(`[experimental:audit-ia] ${message}`)
}

function utcTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\.\d+Z$/, 'Z')
}

async function requestCompletion(client: OpenAI, system: string, user: string) {
  try {
    return await client.beta.chat.completions.parse({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: zodResponseFormat(ReportPayloadSchema, 'docs_ia_audit_report'),
    })
  } catch (error) {
    fail(`OpenAI request failed (model "${MODEL}").\n${describeError(error)}`)
  }
}

async function runAudit(system: string, user: string) {
  if (!process.env.OPENAI_API_KEY) {
    fail(
      'OPENAI_API_KEY is not set. Add it to apps/docs/.env.local (this script only supports OpenAI).'
    )
  }

  const client = new OpenAI()
  const completion = await requestCompletion(client, system, user)

  const message = completion.choices[0]?.message
  if (message?.refusal) {
    fail(`OpenAI refused to produce the audit: ${message.refusal}`)
  }
  if (!message?.parsed) {
    fail(`OpenAI response did not include a parsed result: ${JSON.stringify(completion)}`)
  }

  return message.parsed
}

async function main() {
  const { values } = parseArgs({
    options: {
      report: { type: 'boolean', default: false },
      pr: { type: 'boolean', default: false },
    },
  })

  console.error(`Downloading audit-docs-ia skill from ${SKILL_REPO_URL}...`)
  const skill = downloadSkill()

  console.error('Gathering evidence from apps/docs...')
  const evidence = gatherEvidence()

  console.error(`Running audit via OpenAI (${MODEL})...`)
  const payload = await runAudit(buildSystemPrompt(skill), buildUserPrompt(evidence))

  const report = {
    skill: 'audit-docs-ia',
    skill_source: `https://github.com/${SKILL_REPO_OWNER}/${SKILL_REPO_NAME}/blob/${skill.commit}/${SKILL_PATH}/SKILL.md`,
    generated_at: new Date().toISOString(),
    target: 'apps/docs',
    phases_covered: ['navigation', 'duplication', 'relationship', 'agent-surface'],
    model: MODEL,
    issues: payload.issues,
  }

  const fileName = `${utcTimestamp()}-docs-ia-audit.json`
  const json = JSON.stringify(report, null, 2)

  if (values.report) {
    const reportsDir = path.join(__dirname, 'reports')
    const filePath = path.join(reportsDir, fileName)
    try {
      fs.mkdirSync(reportsDir, { recursive: true })
      fs.writeFileSync(filePath, json)
    } catch (error) {
      fail(`Could not write report to ${filePath}.\n${describeError(error)}`)
    }
    console.error(`Report written to ${filePath}`)
  }

  let prUrl: string | undefined
  if (values.pr) {
    console.error(`Opening a PR against ${SKILL_REPO_OWNER}/${SKILL_REPO_NAME}...`)
    prUrl = await openReportPr(json, fileName, report.issues.length)
    console.error(`PR opened: ${prUrl}`)
  }

  console.log(prUrl ? JSON.stringify({ ...report, pr_url: prUrl }, null, 2) : json)
}

main().catch((error) => {
  console.error('Fatal error:', describeError(error))
  process.exit(1)
})
