import { expect, type Page } from '@playwright/test'

import { env } from '../env.config.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

/**
 * Studio's editors (@monaco-editor/react) and GraphiQL (@graphiql/react) historically ran as
 * two separate Monaco instances on one page. Each injects Monaco's global CSS (.monaco-editor
 * layout rules + .mtk* theme classes), and they collide: after visiting GraphiQL the SQL
 * editor's Monaco wrapper got reflowed to a ~5px slit (covered by the background) and its
 * syntax colors swapped to GraphiQL's theme.
 *
 * IMPORTANT: the bug only reproduces with *client-side* (SPA) navigation. A full `page.goto`
 * reload unloads GraphiQL's CSS chunk, which removes the offending injected rule — so these
 * tests navigate via the Next router to keep the chunk loaded, exactly like a real user.
 */
test.describe('Monaco / GraphiQL coexistence', () => {
  test.skip(env.IS_PLATFORM, 'Self-hosted mode only — GraphiQL + SQL editor on one local project')

  // Client-side navigation (keeps already-loaded chunks/CSS in place). The Next
  // build exposes `window.next.router`; the TanStack build has no equivalent
  // global, but its router subscribes to popstate, so pushState + popstate
  // emulates the same SPA navigation without unloading chunks.
  const routerPush = async (page: Page, path: string) => {
    await page.evaluate((p) => {
      const router = (window as unknown as { next?: { router?: { push: (p: string) => void } } })
        .next?.router
      if (router) {
        router.push(p)
        return
      }
      window.history.pushState({}, '', p)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, path)
  }

  const firstEditorHeight = async (page: Page) => {
    const box = await page.locator('.monaco-editor').first().boundingBox()
    return box?.height ?? 0
  }

  const openGraphiQL = async (page: Page, ref: string) => {
    await routerPush(page, `/project/${ref}/integrations/graphiql/graphiql`)
    await expect(page.locator('.graphiql-container'), 'GraphiQL container should load').toBeVisible(
      { timeout: 30000 }
    )
    // GraphiQL mounting its Monaco editor is what injects the global rule that breaks others.
    await expect(
      page.locator('.graphiql-query-editor .monaco-editor').first(),
      'GraphiQL query editor (Monaco) should mount'
    ).toBeVisible({ timeout: 30000 })
  }

  test('SQL editor stays full height after visiting GraphiQL', async ({ page, ref }) => {
    // Baseline: a freshly-loaded SQL editor fills its pane.
    await page.goto(toUrl(`/project/${ref}/sql/new?skip=true`))
    await expect(
      page.locator('.monaco-editor').first(),
      'SQL editor Monaco should render'
    ).toBeVisible({ timeout: 30000 })
    await expect.poll(() => firstEditorHeight(page), { timeout: 15000 }).toBeGreaterThan(100)

    // Client-side: visit GraphiQL, then come back to the SQL editor.
    await openGraphiQL(page, ref)
    await routerPush(page, `/project/${ref}/sql/new?skip=true`)
    await expect(page, 'should navigate back to SQL editor').toHaveURL(/\/sql\//, {
      timeout: 30000,
    })
    await page.locator('.monaco-editor').first().waitFor({ state: 'attached', timeout: 30000 })

    // With the bug the wrapper collapses to ~5px. It must stay full height.
    await expect
      .poll(() => firstEditorHeight(page), {
        timeout: 15000,
        message: 'SQL editor must not collapse to a sliver after visiting GraphiQL',
      })
      .toBeGreaterThan(100)
  })

  test('SQL editor keeps its own theme after visiting GraphiQL', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${ref}/sql/new?skip=true`))
    await expect(
      page.locator('.monaco-editor').first(),
      'SQL editor Monaco should render'
    ).toBeVisible({ timeout: 30000 })

    await openGraphiQL(page, ref)
    await routerPush(page, `/project/${ref}/sql/new?skip=true`)
    await expect(page, 'should navigate back to SQL editor').toHaveURL(/\/sql\//, {
      timeout: 30000,
    })

    // Monaco's token colors are global `.mtk*` classes. GraphiQL's gql-argument color (#6c69ce)
    // must never enter that palette, or every other editor gets rethemed.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const gqlColor = 'rgb(108, 105, 206)' // #6c69ce — GraphiQL's argument.identifier.gql
            for (const sheet of Array.from(document.styleSheets)) {
              let rules: CSSRuleList
              try {
                rules = sheet.cssRules
              } catch {
                continue
              }
              for (const rule of Array.from(rules)) {
                const styleRule = rule as CSSStyleRule
                if (
                  /^\.mtk\d+$/.test(styleRule.selectorText || '') &&
                  styleRule.style?.color === gqlColor
                ) {
                  return true
                }
              }
            }
            return false
          }),
        {
          timeout: 15000,
          message: "GraphiQL's theme must not bleed into the SQL editor's token colors",
        }
      )
      .toBe(false)
  })
})
