/**
 * Shared core for the docs style evaluation. Both the single-page and the
 * batch runner go through here so they produce identical JSON.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { scores } from './scores.mjs'

export const DOCS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const MODEL = 'typesafe-ai/jev'

const ENDPOINT = 'https://ai-gateway.vercel.sh/v1/evaluate'

export function loadApiKey() {
  try {
    process.loadEnvFile(join(DOCS_ROOT, '.env.local'))
  } catch {
    // No .env.local, so fall back to whatever is already in the environment.
  }
  return process.env.AI_GATEWAY_API_KEY
}

// The guide that governs how a page is written. CONTRIBUTING.md covers repo
// mechanics rather than style, so it stays out of the evaluated state.
export const STYLE_GUIDE_FILES = [
  'style-guide/01-voice-and-tone.md',
  'style-guide/02-elements.md',
  'style-guide/03-page-structure.md',
  'style-guide/WORD_LIST.md',
]

export async function loadStyleGuide() {
  const [voiceAndTone, elements, pageStructure, wordList] = await Promise.all(
    STYLE_GUIDE_FILES.map((file) => readFile(join(DOCS_ROOT, file), 'utf-8'))
  )
  return { voiceAndTone, elements, pageStructure, wordList }
}

// The top rung is criteria.length - 1, so an interpolated score maps onto 0-100.
const percent = (score, criteria) => Math.round((score / (criteria.length - 1)) * 1000) / 10

// Label with the rung that actually carries the most probability. Rounding the
// interpolated score instead can name a rung the model didn't pick, because a
// score near a boundary is an average of two rungs rather than a vote for one.
const modalRung = (probabilities, criteria) =>
  criteria[Object.entries(probabilities).sort(([, a], [, b]) => b - a)[0][0]]

/**
 * A 429 or a 5xx is worth another attempt; a 4xx is not. Retries back off
 * exponentially so a burst of parallel requests doesn't hammer a rate limit.
 */
async function post(body, apiKey, attempt = 0) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (response.ok) return response.json()

  const retriable = response.status === 429 || response.status >= 500
  if (retriable && attempt < 4) {
    await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000 + Math.random() * 500))
    return post(body, apiKey, attempt + 1)
  }

  throw new Error(`AI Gateway returned ${response.status}: ${await response.text()}`)
}

export async function evaluatePage({ slug, styleGuide, apiKey }) {
  const source = join('content', `${slug}.mdx`)
  const page = await readFile(join(DOCS_ROOT, source), 'utf-8')

  const result = await post(
    { model: MODEL, state: { ...styleGuide, page }, questions: scores },
    apiKey
  )

  return {
    route: `/docs/${slug}`,
    source: `apps/docs/${source}`,
    styleGuide: STYLE_GUIDE_FILES.map((file) => `apps/docs/${file}`),
    model: result.model ?? MODEL,
    evaluatedAt: new Date().toISOString(),
    scores: Object.fromEntries(
      Object.entries(result.answers).map(([name, answer]) => [
        name,
        {
          score: answer.score,
          percent: percent(answer.score, scores[name].criteria),
          rung: modalRung(answer.probabilities, scores[name].criteria),
          probabilities: answer.probabilities,
        },
      ])
    ),
    usage: result.usage,
    cost: result.providerMetadata?.gateway?.cost,
  }
}

export async function writeResult(slug, output) {
  const destination = join(DOCS_ROOT, 'content', `${slug}.style-eval.json`)
  await writeFile(destination, `${JSON.stringify(output, null, 2)}\n`)
  return destination
}
