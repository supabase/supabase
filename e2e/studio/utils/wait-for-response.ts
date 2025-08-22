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
  // regex trims "/" both start and end.
  const trimmedBasePath = basePath.replace(/^\/+|\/+$/g, '')
  const httpMethod = options?.method

  await page.waitForResponse((response) => {
    const urlMatches =
      response.url().includes(`${trimmedBasePath}/${ref}/${action}`) ||
      response.url().includes(`${trimmedBasePath}/default/${action}`)

    // checks HTTP method if exists
    return httpMethod ? urlMatches && response.request().method() === httpMethod : urlMatches
  })
}

type Options = {
  method?: HttpMethod
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
