/**
 * Entry point for `braintrust push` to deploy scorers to Braintrust.
 *
 * Excluded scorers:
 *   - sqlSyntaxScorer, sqlIdentifierQuotingScorer: use libpg-query (WASM),
 *     which esbuild cannot bundle for Braintrust's remote infra.
 *   - toolUsageScorer: requires expected.requiredTools, offline-eval-only.
 *   - correctnessScorer: requires ground truth (expected output), offline-eval-only.
 */

import braintrust, { type EvalScorer } from 'braintrust'

import {
  completenessScorer,
  concisenessScorer,
  docsFaithfulnessScorer,
  goalCompletionScorer,
  urlValidityScorer,
  type AssistantEvalInput,
  type AssistantEvalOutput,
  type Expected,
} from './scorer'
import manifest from './scorer-online-manifest.json'

const projectId = process.env.BRAINTRUST_PROJECT_ID
if (!projectId && process.env.IS_BRAINTRUST_PUSH)
  throw new Error('BRAINTRUST_PROJECT_ID is not set')

// When running in CI, prefix scorers with the branch name to avoid collisions between PRs
// in the staging project. GITHUB_HEAD_REF is only set on PR events, not push events (e.g. master).
const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME
const prNumber = process.env.GITHUB_PR_NUMBER ? Number(process.env.GITHUB_PR_NUMBER) : undefined
const prefix = process.env.GITHUB_HEAD_REF
  ? `${process.env.GITHUB_HEAD_REF.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-`
  : ''
const metadata = branch ? { gitBranch: branch, ...(prNumber && { prNumber }) } : undefined
const description = prNumber && branch ? `#${prNumber} · ${branch}` : branch

const handlers = {
  'goal-completion': goalCompletionScorer,
  conciseness: concisenessScorer,
  completeness: completenessScorer,
  'docs-faithfulness': docsFaithfulnessScorer,
  'url-validity': urlValidityScorer,
} satisfies Record<string, EvalScorer<AssistantEvalInput, AssistantEvalOutput, Expected>>

// @ts-expect-error - Project ID is only required at build-time
const project = braintrust.projects.create({ id: projectId })

for (const { slug, name } of manifest) {
  project.scorers.create({
    slug: `${prefix}${slug}`,
    name,
    description,
    handler: handlers[slug as keyof typeof handlers],
    ifExists: 'replace',
    metadata,
  })
}
