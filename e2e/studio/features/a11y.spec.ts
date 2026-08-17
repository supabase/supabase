import { expect } from '@playwright/test'

import { env } from '../env.config.js'
import {
  attachScanReport,
  HEADER_SELECTOR,
  MAIN_SELECTOR,
  reportScan,
  SCAN_THEME,
  scanRoute,
  scanShellRegion,
  settleForAxe,
  SIDEBAR_SELECTOR,
  THEME_STORAGE_KEY,
  unloadedResult,
  writeArtifact,
} from '../utils/axe-helpers.ts'
import { createTable, dropTable, query } from '../utils/db/index.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

const SCAN_TIMEOUT_MS = 180_000

const SEED_TABLE = 'pw_a11y_scan'
const SEED_BUCKET = 'pw-a11y-scan'
const SEED_USER_EMAIL = 'pw-a11y-scan@example.com'

// Self-hosted-reachable, structurally distinct routes. Platform-only surfaces such
// as `/org`, `/account`, billing, and branching render null or redirect here.
const ROUTES = [
  { surface: '/project/default', path: '' },
  { surface: '/project/default/editor', path: '/editor?schema=public' },
  { surface: '/project/default/sql', path: '/sql' },
  { surface: '/project/default/database/tables', path: '/database/tables?schema=public' },
  { surface: '/project/default/database/schemas', path: '/database/schemas?schema=public' },
  { surface: '/project/default/auth/users', path: '/auth/users' },
  { surface: '/project/default/storage/files', path: '/storage/files' },
  { surface: '/project/default/advisors/security', path: '/advisors/security' },
  {
    surface: '/project/default/observability/query-performance',
    path: '/observability/query-performance',
  },
  { surface: '/project/default/settings/general', path: '/settings/general' },
] as const

// The shell is identical on every route, so it gets its own scan units instead of
// being counted on all ten.
const SHELL_REGIONS = [
  { surface: 'shell/sidebar', include: SIDEBAR_SELECTOR },
  { surface: 'shell/header', include: HEADER_SELECTOR },
] as const

// Storage tables reject direct writes, so buckets go through the Storage API.
function serviceRequest(path: string, init: RequestInit) {
  return fetch(`${env.API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      apikey: env.SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SERVICE_ROLE_KEY}`,
    },
  })
}

// An empty route that baselines at zero is how a ratchet silently stops working.
// Each seed is idempotent so a rerun after a failed cleanup still works.
async function seedScannableContent() {
  await createTable(SEED_TABLE, 'name', [{ name: 'accessibility' }, { name: 'scan' }])

  await serviceRequest('/storage/v1/bucket', {
    method: 'POST',
    body: JSON.stringify({ id: SEED_BUCKET, name: SEED_BUCKET, public: false }),
  })

  await serviceRequest('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: SEED_USER_EMAIL,
      password: 'pw-a11y-scan-password',
      email_confirm: true,
    }),
  })
}

async function removeScannableContent() {
  await dropTable(SEED_TABLE)
  await serviceRequest(`/storage/v1/bucket/${SEED_BUCKET}`, { method: 'DELETE' })
  await query(`DELETE FROM auth.users WHERE email = $1`, [SEED_USER_EMAIL])
}

test.describe('Studio accessibility scan', () => {
  // Serial keeps the seed and its cleanup on one worker, and keeps the artifact
  // set identical from run to run.
  test.describe.configure({ mode: 'serial' })

  // Studio reads its own stored preference first and only falls back to
  // `prefers-color-scheme`, so emulation alone is not enough.
  test.use({ colorScheme: SCAN_THEME })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, theme }) => localStorage.setItem(key, theme), {
      key: THEME_STORAGE_KEY,
      theme: SCAN_THEME,
    })
  })

  test.beforeAll(async () => {
    await seedScannableContent()
  })

  test.afterAll(async () => {
    await removeScannableContent()
  })

  for (const { surface, path } of ROUTES) {
    test(`${surface} has no new accessibility violations @a11y`, async ({
      page,
      ref,
    }, testInfo) => {
      test.setTimeout(SCAN_TIMEOUT_MS)

      const url = toUrl(`/project/${ref}${path}`)

      let response
      try {
        response = await page.goto(url)
      } catch (error) {
        writeArtifact(unloadedResult(surface, url, null, 'document'))
        throw error
      }

      const status = response?.status() ?? null

      if (!response?.ok()) {
        const unloaded = unloadedResult(surface, page.url(), status, 'document')
        writeArtifact(unloaded)
        await attachScanReport(testInfo, unloaded)
        expect(response?.ok(), `Expected a successful response for ${surface}, got ${status}`).toBe(
          true
        )
        return
      }

      // The shell returns null until it mounts, so an unsettled scan sees an empty
      // document.
      await settleForAxe(page)
      await expect(
        page.locator(MAIN_SELECTOR),
        `No ${MAIN_SELECTOR} on ${surface}. The app shell never mounted, so there is nothing to scan.`
      ).toBeAttached()

      const result = await scanRoute(page, surface)
      result.status = status

      await reportScan(testInfo, result, 'the route content')
    })
  }

  for (const { surface, include } of SHELL_REGIONS) {
    test(`${surface} has no new accessibility violations @a11y`, async ({
      page,
      ref,
    }, testInfo) => {
      test.setTimeout(SCAN_TIMEOUT_MS)

      await page.goto(toUrl(`/project/${ref}`))
      await settleForAxe(page)

      await expect(
        page.locator(include).first(),
        `No element matching "${include}" on the project home page.`
      ).toBeAttached()

      const result = await scanShellRegion(page, surface, include)
      await reportScan(testInfo, result, include)
    })
  }
})
