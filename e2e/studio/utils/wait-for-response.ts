import { Page } from '@playwright/test'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Waits for a API response for a specific endpoint before continuing the playwright test.
 * @param page - Playwright page object
 * @param basePath - Base path of API endpoint to wait for (e.g. 'pg-meta', 'platform/projects', etc.)
 * @param ref - Project reference
 * @param action - Action path of API endpoint to wait for (e.g. 'types', 'triggers', 'content', etc.)
 * @param options - Optional object which checks more scenarios
 */
export async function waitForApiResponse(
  page: Page,
  basePath: string,
  ref: string,
  action: string,
  options?: Options
): Promise<void> {
  return createApiResponseWaiter(page, basePath, ref, action, options)
}

function buildUrlMatcher(basePath: string, ref: string, action: string, method?: HttpMethod) {
  // Normalize inputs and build a tolerant matcher that works across environments
  const trimmedBasePath = basePath.replace(/^\/+|\/+$/g, '')
  const refAlternatives = [ref, 'default']

  return (response: any) => {
    const url = response.url()
    const requestMethod = response.request().method()

    // Must include base path and one of the ref alternatives
    const hasBasePath = url.includes(`${trimmedBasePath}/`)
    const hasRef = refAlternatives.some((r) => url.includes(`/${r}/`))

    // Action match should be tolerant to extra query params ordering
    const hasAction = url.includes(action)

    const urlMatches = hasBasePath && hasRef && hasAction
    if (method) return urlMatches && requestMethod === method
    return urlMatches
  }
}

/**
 * Starts listening for a specific API response and returns a promise you can await later.
 * Use this to avoid races by creating the waiter BEFORE triggering navigation/clicks.
 *
 * Example:
 *   const wait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=schemas')
 *   await page.goto(...)
 *   await wait
 */
export function createApiResponseWaiter(
  page: Page,
  basePath: string,
  ref: string,
  action: string,
  options?: Options
): Promise<void> {
  const matcher = buildUrlMatcher(basePath, ref, action, options?.method)

  return page
    .waitForResponse(matcher, { timeout: options?.timeout })
    .then(() => {})
    .catch((error) => {
      const trimmedBasePath = basePath.replace(/^\/+|\/+$/g, '')
      const message = `Error waiting for response: ${error}. Method: ${options?.method}, URL contains: ${trimmedBasePath}/(default|${ref})/${action}`
      if (options?.soft) {
        console.warn(`[soft-wait] ${message}`)
        const fallback = options?.fallbackWaitMs ?? 0
        if (fallback > 0) {
          return page.waitForTimeout(fallback).then(() => {})
        }
        return
      } else {
        console.error(message)
        throw error
      }
    })
}

type Options = {
  method?: HttpMethod
  timeout?: number
  // When true, do not throw on timeout/error; optionally wait fallbackWaitMs and continue
  soft?: boolean
  fallbackWaitMs?: number
}

export async function waitForTableToLoad(page: Page, ref: string, schema?: string) {
  const tableSchema = schema || 'public'
  return await waitForApiResponse(page, 'pg-meta', ref, `query?key=entity-types-${tableSchema}-`)
}

export async function waitForGridDataToLoad(page: Page, ref: string) {
  return await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-rows-')
}

export async function waitForDatabaseToLoad(page: Page, ref: string, schema?: string) {
  const databaseSchema = schema || 'public'
  return await waitForApiResponse(
    page,
    'pg-meta',
    ref,
    `tables?include_columns=true&included_schemas=${databaseSchema}`
  )
}
