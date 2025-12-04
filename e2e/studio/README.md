# Supabase Studio E2E Tests

## Set up

### Prerequisites

#### For Self-Hosted Tests

- Nothing is required, running with IS_PLATFORM=false should run the tests locally with a self hosted docker container

#### For Platform Tests

1. **Create a platform account** with an email and password, these auths are used for the test
2. **Create an organization** on the platform, this can be done if run locally through `mise fullstack`
3. **Generate a Personal Access Token (PAT)** for API access
4. Configure the environment variables below

### Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set the appropriate values based on your test environment (see Environment Variables section below).

### Install the playwright browser

⚠️ This should be done in the `e2e/studio` directory

```bash
cd e2e/studio

pnpm exec playwright install
```

### Environment Variables

Configure your tests by setting the following environment variables in `.env.local`. We have examples of what required on self hosted and platform:

#### Core Configuration

- **`STUDIO_URL`**: The URL where Studio is running (default: `http://localhost:8082`)
- **`API_URL`**: The Supabase API endpoint (default: `https://localhost:8080`)
- **`IS_PLATFORM`**: Set to `true` for platform tests, `false` for self-hosted (default: `false`)
  - When `true`: Tests run serially (1 worker) due to API rate limits
  - When `false`: Tests run in parallel (5 workers)

#### Authentication (Required for Platform Tests)

⚠️ **Before running platform tests, you must create an account with an email, password, and organization on the platform you're testing.**

- **`EMAIL`**: Your platform account email (required for authentication)
- **`PASSWORD`**: Your platform account password (required for authentication)
- **`PROJECT_REF`**: Project reference (optional, will be auto-created if not provided)

When both `EMAIL` and `PASSWORD` are set, authentication is automatically enabled. HCaptcha is mocked during test setup.

#### Platform-Specific Variables (Required when `IS_PLATFORM=true`)

- **`ORG_SLUG`**: Organization slug (default: `default`)
- **`SUPA_REGION`**: Supabase region (default: `us-east-1`)
- **`SUPA_PAT`**: Personal Access Token for API authentication (default: `test`)
- **`BRANCH_NAME`**: Name for the test branch/project (default: `e2e-test-local`)

#### Optional Variables

- **`OPENAI_API_KEY`**: Required for the AI Assistant test (`assistant.spec.ts`). Without this variable, the assistant test will be skipped.
- **`VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO`**: Bypass token for Vercel protection (default: `false`)

#### Setup Commands Based on Configuration

The test setup automatically runs different commands based on your environment:

- **Platform + Localhost** (`IS_PLATFORM=true` and `STUDIO_URL=localhost`): Runs `pnpm run e2e:setup:platform`
- **Platform + Remote** (`IS_PLATFORM=true` and remote `STUDIO_URL`): No web server setup
- **Self-hosted** (`IS_PLATFORM=false`): Runs `pnpm run e2e:setup:selfhosted`

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
