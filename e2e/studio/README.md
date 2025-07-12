# Supabase Studio E2E Tests

## Set up

```bash
cp .env.local.example .env.local
```

Edit the `.env.local` file with your credentials and environment.

### Install the playwright browser

⚠️ This should be done in the `e2e/studio` directory

```bash
pnpm exec playwright install
```

## Environments

### Staging

```bash
STUDIO_URL=https://supabase.green/dashboard
API_URL=https://api.supabase.green
AUTHENTICATION=true
EMAIL=your@email.com
PASSWORD=yourpassword
PROJECT_REF=yourprojectref
```

### CLI (NO AUTH)

You'll need to run the CLI locally.

```bash
STUDIO_URL=http://localhost:54323
API_URL=http://localhost:54323/api
AUTHENTICATION=false
```

### CLI Development (NO AUTH)

You'll need to run Studio in development mode with `IS_PLATFORM=false`

```bash
STUDIO_URL=http://localhost:8082/
API_URL=http://localhost:8082/api
AUTHENTICATION=false
```

### Hosted Development

You'll need to run Studio in development mode with `IS_PLATFORM=true`

```bash
STUDIO_URL=http://localhost:8082/
API_URL=http://localhost:8080/api
AUTHENTICATION=true
EMAIL=your@email.com
PASSWORD=yourpassword
PROJECT_REF=yourprojectref
```

---

## Running the tests

Check the `package.json` for the available commands and environments.

#### Example:

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

## Organization

Name the folders based on the feature you are testing.

```bash
e2e/studio/logs/
e2e/studio/sql-editor/
e2e/studio/storage/
e2e/studio/auth/
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
