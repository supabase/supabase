/**
 * Entry point for `braintrust push` to deploy scorers to Braintrust.
 *
 * Excluded scorers:
 *   - sqlSyntaxScorer, sqlIdentifierQuotingScorer: use libpg-query (WASM),
 *     which esbuild cannot bundle for Braintrust's remote infra.
 *   - toolUsageScorer: requires expected.requiredTools, offline-eval-only.
 */

import braintrust from 'braintrust'

import {
  completenessScorer,
  concisenessScorer,
  correctnessScorer,
  docsFaithfulnessScorer,
  goalCompletionScorer,
  urlValidityScorer,
} from './scorer'

const projectId = process.env.BRAINTRUST_PROJECT_ID
if (!projectId && process.env.IS_PUSH) throw new Error('BRAINTRUST_PROJECT_ID is not set')

const scorers = [
  { slug: 'goal-completion', name: 'Goal Completion', handler: goalCompletionScorer },
  { slug: 'conciseness', name: 'Conciseness', handler: concisenessScorer },
  { slug: 'completeness', name: 'Completeness', handler: completenessScorer },
  { slug: 'docs-faithfulness', name: 'Docs Faithfulness', handler: docsFaithfulnessScorer },
  { slug: 'correctness', name: 'Correctness', handler: correctnessScorer },
  { slug: 'url-validity', name: 'URL Validity', handler: urlValidityScorer },
]

// @ts-expect-error - Project ID is only required at build-time
const project = braintrust.projects.create({ id: projectId })

for (const { slug, name, handler } of scorers) {
  project.scorers.create({ slug, name, handler, ifExists: 'replace' })
}
