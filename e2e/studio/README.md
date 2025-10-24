# Supabase Studio E2E Tests

## Set up

```bash
cp .env.local.example .env.local
```

### Install the playwright browser

⚠️ This should be done in the `e2e/studio` directory

```bash
cd e2e/studio

pnpm exec playwright install
```

### Run a local Supabase instance

Make sure you have Supabase CLI installed

```bash
cd e2e/studio

supabase start
```

---

## Running the tests

Check the `package.json` for the available commands and environments.

```bash
pnpm run e2e
```

With Playwright UI:

```bash
pnpm run e2e -- --ui
```

---

## Tips for development

- Read [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- Use `pnpm run e2e -- --ui` to get the playwright UI.
- Add the tests in `examples/examples.ts` to Cursor as context.
- Add messages to expect statements to make them easier to debug.

Example:

```ts
await expect(page.getByRole('heading', { name: 'Logs & Analytics' }), {
  message: 'Logs heading should be visible',
}).toBeVisible()
```

- Use the test utility instead of playwrights test.

```ts
import { test } from '../utils/test'
```

- Use the PWDEBUG environment variable to debug the tests.

```bash
PWDEBUG=1 pnpm run e2e -- --ui
```

---

## What should I test?

- Can the feature be navigated to?
- Does the feature load correctly?
- Can you do the actions (filtering, sorting, opening dialogs, etc)?

---

## API Mocks

Read here: https://playwright.dev/docs/mock#mock-api-requests

Example:

```ts
await page.route(`*/**/logs.all*`, async (route) => {
  await route.fulfill({ body: JSON.stringify(mockAPILogs) })
})
```
