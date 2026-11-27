/**
 * Captures card screenshots of each template's live demo, in light and dark.
 *
 *   pnpm --filter templates screenshots            # every template
 *   pnpm --filter templates screenshots kanban     # one template
 *
 * Uses the installed Google Chrome (no browser download). Each capture runs in
 * a fresh guest session, so demos show what a first-time visitor sees, after
 * any setup a visitor would do (adding sample photos, joining the waitlist).
 * Images are written to public/screenshots/<slug>-<theme>.jpg.
 */

import { mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium, type Page } from '@playwright/test'

import type { Example } from '../src/data/types'

type Theme = 'light' | 'dark'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public/screenshots')
const EXAMPLES_DIR = join(ROOT, 'src/data/examples')
const VIEWPORT = { width: 800, height: 500 }

/** Gets each demo into a representative state before the screenshot. */
const PREPARE: Record<string, (page: Page, theme: Theme) => Promise<void>> = {
  kanban: async (page) => {
    await page.locator('article').nth(4).waitFor()
  },
  'photo-wall': async (page) => {
    await page.getByRole('button', { name: 'Add sample photos' }).click()
    await page.getByText('6 photos').waitFor({ timeout: 30_000 })
    await waitForImages(page)
  },
  'uptime-monitor': async (page) => {
    // Checks run every 30 seconds; an incident opens after two failures.
    await page.getByText(/Down since/).waitFor({ timeout: 180_000 })
  },
  yourmind: async (page) => {
    await page.locator('article').nth(5).waitFor()
    await page.waitForFunction(() => !document.body.innerText.includes('Reading…'), null, {
      timeout: 60_000,
    })
    await waitForImages(page)
  },
  waitlist: async (page, theme) => {
    await page.getByLabel('Your name').fill('Ada Lovelace')
    await page.getByLabel('Email').fill(`ada+${theme}-${Date.now()}@example.com`)
    await page.getByRole('button', { name: 'Save my spot' }).click()
    await page.getByText('You’re on the list').waitFor()
  },
}

async function waitForImages(page: Page) {
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
    null,
    { timeout: 30_000 }
  )
}

async function capture(slug: string, url: string, theme: Theme) {
  const browser = await chromium.launch({ channel: 'chrome' })
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 3,
      colorScheme: theme,
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })
    await PREPARE[slug]?.(page, theme)
    // Let transitions and lazy images settle.
    await page.waitForTimeout(1500)
    const path = join(OUT_DIR, `${slug}-${theme}.jpg`)
    await page.screenshot({ path, type: 'jpeg', quality: 82 })
    console.log(`✓ ${slug} (${theme})`)
  } finally {
    await browser.close()
  }
}

/** Loads src/data/examples/*.ts directly (the app's registry relies on Vite). */
async function loadExamples(): Promise<Example[]> {
  const files = (await readdir(EXAMPLES_DIR)).filter((file) => file.endsWith('.ts'))
  return Promise.all(
    files.map(async (file) => {
      const loaded = await import(pathToFileURL(join(EXAMPLES_DIR, file)).href)
      return loaded.example as Example
    })
  )
}

async function main() {
  const only = process.argv.slice(2)
  const examples = (await loadExamples()).filter(
    (example) => only.length === 0 || only.includes(example.slug)
  )
  await mkdir(OUT_DIR, { recursive: true })
  await Promise.all(
    examples.flatMap((example) =>
      (['light', 'dark'] as const).map((theme) =>
        capture(example.slug, example.demoUrl, theme).catch((error) => {
          console.error(`✗ ${example.slug} (${theme}): ${error.message}`)
          process.exitCode = 1
        })
      )
    )
  )
}

main()
