import { randomUUID } from 'node:crypto'
import type { Page } from '@playwright/test'

import { toUrl } from './to-url.js'

export async function openExplorerQuery(page: Page, ref: string, sql: string) {
  const id = randomUUID()
  await page.addInitScript(
    ({ id, ref, sql }) => {
      const key = `explorer-query-drafts-${ref}`
      const drafts = JSON.parse(localStorage.getItem(key) ?? '{}')
      drafts[id] = {
        name: 'Row editing test',
        source: { _tag: 'database' },
        sql,
        updatedAt: Date.now(),
        view: 'table',
      }
      localStorage.setItem(key, JSON.stringify(drafts))
    },
    { id, ref, sql }
  )
  await page.goto(toUrl(`/project/${ref}/explorer/query/${id}`))
  await page.getByRole('button', { name: 'Run', exact: true }).click()
}
