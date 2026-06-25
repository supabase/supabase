---
name: studio-e2e-tests
description: Write and run Playwright E2E tests for Supabase Studio. Use when asked
  to run e2e tests, write new E2E tests, or debug flaky tests. Covers running commands,
  avoiding race conditions, waiting strategies, selectors, helper functions, and CI
  vs local differences.
---

# E2E Studio Tests

Run Playwright end-to-end tests for the Studio application.

## Running Tests

Tests must be run from the `e2e/studio` directory:

```bash
cd e2e/studio && pnpm run e2e
```

### Run specific file

```bash
cd e2e/studio && pnpm run e2e -- features/cron-jobs.spec.ts
```

### Run with grep filter

```bash
cd e2e/studio && pnpm run e2e -- --grep "test name pattern"
```

### UI mode for debugging

```bash
cd e2e/studio && pnpm run e2e -- --ui
```

## Environment Setup

- Tests auto-start Supabase local containers via web server config
- Self-hosted mode (`IS_PLATFORM=false`) runs tests in parallel (3 workers)
- No manual setup needed for self-hosted tests

## Test File Structure

- Tests are in `e2e/studio/features/*.spec.ts`
- Use custom test utility: `import { test } from '../utils/test.js'`
- Test fixtures provide `page`, `ref`, and other helpers

## Common Patterns

Wait for elements with generous timeouts:

```typescript
await expect(locator).toBeVisible({ timeout: 30000 })
```

Add messages to expects for debugging:

```typescript
await expect(locator).toBeVisible({ timeout: 30000 }, 'Element should be visible after page load')
```

Use serial mode for tests sharing database state:

```typescript
test.describe.configure({ mode: 'serial' })
```

## Writing Robust Selectors

### Selector priority (best to worst)

1. **`getByRole` with accessible name** - Most robust, tests accessibility

   ```typescript
   page.getByRole('button', { name: 'Save' })
   page.getByRole('button', { name: 'Configure API privileges' })
   ```

2. **`getByTestId`** - Stable, explicit test hooks

   ```typescript
   page.getByTestId('table-editor-side-panel')
   ```

3. **`getByText` with exact match** - Good for unique text

   ```typescript
   page.getByText('Data API Access', { exact: true })
   ```

4. **`locator` with CSS** - Use sparingly, more fragile
   ```typescript
   page.locator('[data-state="open"]')
   ```

### Patterns to avoid

- **XPath selectors** - Fragile to DOM changes

  ```typescript
  // BAD
  locator('xpath=ancestor::div[contains(@class, "space-y")]')
  ```

- **Parent traversal with `locator('..')`** - Breaks when structure changes

  ```typescript
  // BAD
  element.locator('..').getByRole('button')
  ```

- **Broad `filter({ hasText })` on generic elements** - May match multiple elements
  ```typescript
  // BAD - popover may have more than one combobox
  // Could consider scoping down the container or filtering the combobox more specifically
  popover.getByRole('combobox')
  ```

### Add accessible labels to components

When a component lacks a good accessible name, add one in the source code:

```tsx
// In the React component
<Button aria-label="Configure API privileges">
  <Settings />
</Button>
```

Then use it in tests:

```typescript
page.getByRole('button', { name: 'Configure API privileges' })
```

### Narrowing search scope

Scope selectors to specific containers to avoid matching wrong elements:

```typescript
// Good - scoped to side panel
const sidePanel = page.getByTestId('table-editor-side-panel')
const toggle = sidePanel.getByRole('switch')

// Good - find unique element, then scope from there
const popover = page.locator('[data-radix-popper-content-wrapper]')
const roleSection = popover.getByText('Anonymous (anon)', { exact: true })
```

## Avoiding Race Conditions

**Set up API waiters BEFORE triggering actions.** This is the most common source of flaky tests.

```ts
// ❌ Race condition — response may complete before waiter is set up
await page.getByRole('button', { name: 'Save' }).click()
await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-create')

// ✅ Waiter is ready before the action
const apiPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-create')
await page.getByRole('button', { name: 'Save' }).click()
await apiPromise
```

Same rule applies before navigation:

```ts
const loadPromise = waitForTableToLoad(page, ref)
await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
await loadPromise
```

When an action triggers multiple API calls, wait for all of them:

```ts
const createTablePromise = waitForApiResponseWithTimeout(page, (r) =>
  r.url().includes('query?key=table-create')
)
const tablesPromise = waitForApiResponseWithTimeout(page, (r) =>
  r.url().includes('tables?include_columns=true')
)

await page.getByRole('button', { name: 'Save' }).click()
await Promise.all([createTablePromise, tablesPromise])
```

## Waiting Strategies

Playwright auto-waits for elements to be actionable — prefer this over manual timeouts.

Use `expect.poll` for dynamic state changes:

```ts
await expect.poll(async () => await page.getByLabel(`View ${tableName}`).count()).toBe(0)
```

Use `waitForSelector` with state for element lifecycle:

```ts
await page.waitForSelector('[data-testid="side-panel"]', { state: 'detached' })
```

Avoid `networkidle` — use specific API waits instead:

```ts
// ❌ Unreliable and slow
await page.waitForLoadState('networkidle')

// ✅ Specific API response
await waitForApiResponse(page, 'pg-meta', ref, 'tables')
```

Timeouts are acceptable only for client-side debounces:

```ts
await page.getByRole('textbox').fill('search term')
await page.waitForTimeout(300) // allow debounce
```

## Avoiding `waitForTimeout`

Never use `waitForTimeout` - always wait for something specific:

```typescript
// BAD
await page.waitForTimeout(1000)

// GOOD - wait for UI element
await expect(page.getByText('Success')).toBeVisible()

// GOOD - wait for API response
const apiPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-create')
await saveButton.click()
await apiPromise

// GOOD - wait for toast indicating operation complete
await expect(page.getByText('Table created successfully')).toBeVisible({ timeout: 15000 })
```

## Avoiding `force: true` on clicks

Instead of forcing clicks on hidden elements, make them visible first:

```typescript
// BAD
await menuButton.click({ force: true })

// GOOD - hover to reveal, then click
await tableRow.hover()
await expect(menuButton).toBeVisible()
await menuButton.click()
```

## Test Structure

Always import from the custom test utility:

```ts
import { test } from '../utils/test.js'
```

Use `withFileOnceSetup` for expensive setup that should run once per file:

```ts
test.beforeAll(async ({ browser, ref }) => {
  await withFileOnceSetup(import.meta.url, async () => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await deleteTestTables(page, ref)
  })
})

test.afterAll(async () => {
  await releaseFileOnceCleanup(import.meta.url)
})
```

Dismiss toasts before interacting — they can overlay buttons:

```ts
const dismissToastsIfAny = async (page: Page) => {
  const closeButtons = page.getByRole('button', { name: 'Close toast' })
  const count = await closeButtons.count()
  for (let i = 0; i < count; i++) {
    await closeButtons.nth(i).click()
  }
}

await dismissToastsIfAny(page)
await page.getByRole('button', { name: 'New table' }).click()
```

## Assertions

Always include descriptive messages for easier debugging:

```ts
// ❌ No context on failure
await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()

// ✅ Clear message on failure
await expect(
  page.getByRole('button', { name: 'Save' }),
  'Save button should be visible after form is filled'
).toBeVisible()
```

Use explicit timeouts for slow operations:

```ts
await expect(
  page.getByText(`Table ${tableName} is good to go!`),
  'Success toast should be visible after table creation'
).toBeVisible({ timeout: 50000 })
```

## Helper Functions

Extract reusable operations into domain helpers (e.g. `e2e/studio/utils/storage-helpers.ts`).
Use the existing wait utilities:

```ts
import {
  createApiResponseWaiter,
  waitForApiResponse,
  waitForGridDataToLoad,
  waitForTableToLoad,
} from '../utils/wait-for-response.js'
```

Use `expectClipboardValue` instead of manual clipboard reads with hardcoded timeouts:

```ts
// ❌ Brittle
await page.evaluate(() => navigator.clipboard.readText())
await page.waitForTimeout(500)

// ✅ Uses Playwright auto-retries
await expectClipboardValue({ page, value: 'expectedValue' })
```

## API Mocking

```ts
await page.route('*/**/logs.all*', async (route) => {
  await route.fulfill({ body: JSON.stringify(mockAPILogs) })
})
```

Use soft waits for optional API calls:

```ts
await waitForApiResponse(page, 'pg-meta', ref, 'optional-endpoint', {
  soft: true,
  fallbackWaitMs: 1000,
})
```

## Cleanup

Clean up test data in `beforeAll`/`beforeEach`. Check before deleting to handle existing state gracefully:

```ts
const bucketRow = page.getByRole('row').filter({ hasText: bucketName })
if ((await bucketRow.count()) === 0) return
// proceed with deletion
```

Reset local storage after tests that modify it:

```ts
import { resetLocalStorage } from '../utils/reset-local-storage.js'

await resetLocalStorage(page, ref)
```

## Debugging

### View trace

```bash
cd e2e/studio && pnpm exec playwright show-trace <path-to-trace.zip>
```

### View HTML report

```bash
cd e2e/studio && pnpm exec playwright show-report
```

### Error context

Error context files are saved in the `test-results/` directory.

### Playwright MCP tools

Use Playwright MCP tools to inspect UI when debugging locally.

## CI vs Local Development

The key difference is **cold start vs warm state**:

### CI (cold start)

Tests run from a blank database slate. Each test run resets the database and starts fresh containers. Extensions like pg_cron are NOT enabled by default.

### Local dev with `pnpm dev:studio-local`

When debugging with a running dev server, the database may already have state from previous runs (extensions enabled, test data present).

## Handling Cold Start Bugs

Tests that work locally but fail in CI often have assumptions about existing state.

### Common issues

1. Extension not enabled (must enable in test setup)
2. Race conditions when parallel tests try to modify shared state (use `test.describe.configure({ mode: 'serial' })`)
3. Locators matching wrong elements because the page structure differs when state isn't set up

### Reproducing CI behavior locally

The test framework automatically resets the database when running `pnpm run e2e`. This matches CI behavior.

If using `pnpm dev:studio-local` for Playwright MCP debugging, remember the state differs from CI.

## Debugging Workflow for CI Failures

1. First, run the test locally with `pnpm run e2e -- features/<file>.spec.ts` (cold start)
2. Check error context in `test-results/` directory
3. If you need to inspect UI state, start `pnpm dev:studio-local` and use Playwright MCP tools
4. Remember: what you see in the dev server may have state that doesn't exist in CI
