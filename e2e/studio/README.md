# Supabase Studio E2E Tests

## Goal

Make sure new features, bug fixes or refactors do not break existing functionality.

---

## Set up

```bash
cp .env.example .env.local
```

Edit the `.env.local` file with your credentials.

---

## Running the tests

Check the `package.json` for the available commands and environments.

```bash
npm run test:e2e
```

---

## Tips for development

- Use `npm run test:e2e -- --ui` to get the playwright UI.
- Add the tests in `examples/examples.ts` to Cursor as context.
- Use the test utility instead of playwrights test.

```ts
import { test } from '../utils/test'
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
