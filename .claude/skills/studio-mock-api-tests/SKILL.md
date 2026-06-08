---
name: studio-mock-api-tests
description: Component tests for Supabase Studio that mock API requests at the
  network layer with MSW. Use when writing or reviewing a component test that
  exercises a React Query hook or mutation, or when migrating an existing
  test away from vi.mock('@/data/...'). Covers the customRender + addAPIMock
  template and the jsdom/MSW gotchas that cost real debugging time.
---

# Studio MSW component tests

Mount a Studio component, intercept its network calls with MSW, assert
what renders and what gets sent. The infrastructure is already wired up —
this skill is the working template plus the gotchas.

## When to use

- The component (or any descendant it renders) calls a React Query hook
  or mutation that hits `/platform/...`, `/v1/...`, or another endpoint
  in `apps/studio/data/api.d.ts`.
- You'd otherwise be tempted to write `vi.mock('@/data/some-query', ...)`.
  **Don't.** Mock the network instead — see "Why not vi.mock" below.

If the component is purely presentational with no data fetching, you
don't need MSW; render and assert directly.

## The template

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { MyComponent } from './MyComponent'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// Needed if the component renders inside a Sheet, Modal, Popover, or
// anything else built on Radix that uses Web Animations.
mockAnimationsApi()

describe('MyComponent', () => {
  test('renders rows from the API', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<OrganizationResponse[]>([
          {
            /* ... */
          },
        ]),
    })

    customRender(<MyComponent />)

    expect(await screen.findByText('Acme')).toBeInTheDocument()
  })
})
```

That's the whole pattern. Server lifecycle (`listen`/`resetHandlers`/
`close`) is handled by `apps/studio/tests/vitestSetup.ts` — handlers
registered via `addAPIMock` are scoped to the current test.

## Gotchas that will eat your afternoon

### 1. Path params use `:slug`, not `{slug}`

`addAPIMock` is typed from the OpenAPI `paths`, but path params are
remapped to MSW's `:param` format. Autocomplete will guide you, but if
typecheck reports the path isn't assignable, you're using the OpenAPI
`{slug}` form.

```ts
// ❌ TypeScript error, MSW won't match
path: '/platform/organizations/{slug}/projects'

// ✅ Correct
path: '/platform/organizations/:slug/projects'
```

### 2. Use `HttpResponse.json`, not `new HttpResponse`

For success responses, always go through `HttpResponse.json` — even for
204/201-no-content endpoints. A raw `new HttpResponse(null, { status: 201 })`
returns no content-type, and `openapi-fetch` can hang the mutation flow,
which silently breaks `onSuccess` callbacks.

```ts
// ❌ Mutation onSuccess silently never fires
response: () => new HttpResponse(null, { status: 201 })

// ✅ Works (pass the OpenAPI body shape explicitly — see gotcha #8)
response: () => HttpResponse.json<MyResponse>({}, { status: 201 })
```

### 3. Submit buttons in Sheets/Modals need `fireEvent.click`

The convention `<Button form={FORM_ID} htmlType="submit" />` (button
outside the form, associated by id) doesn't reliably trigger submission
under `userEvent.click` in jsdom. Use `fireEvent.click` for the submit
button. Continue to use `userEvent.type` for inputs.

```ts
await userEvent.type(screen.getByPlaceholderText('value'), 'hello')
fireEvent.click(await screen.findByRole('button', { name: 'Save' }))
```

### 4. Profile-gated queries need a `profileContext`

Many hooks (`useOrganizationsQuery`, anything in `data/projects/`,
anything that calls `useProfile`) refuse to fire until a profile is
loaded. Pass one explicitly:

```ts
import type { ProfileContextType } from '@/lib/profile'

const PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

customRender(<MyComponent />, { profileContext: PROFILE_CONTEXT })
```

### 5. `useParams` is globally mocked to `{ ref: 'default' }`

You don't need to mock the Next router for project-scoped components.
Just use `'default'` as the project ref in your mock paths:
`/v1/projects/default/secrets`, `/platform/projects/default/...`. If
you need a different ref, override with `routerMock.setCurrentUrl(...)`
(see `apps/studio/tests/lib/route-mock.ts`).

### 6. Unhandled requests fail loudly — mock every endpoint a render triggers

`mswServer.listen({ onUnhandledRequest: 'error' })` is set globally. If a
component (or any child it renders) fires an unmocked request, you'll see
MSW errors in stderr and likely flaky behavior. Cards, lists, and details
panels often fire nested queries (e.g. `OrganizationCard` calls
`useOrgProjectsInfiniteQuery`) — read what the rendered subtree does and
mock all of it, or stub it with `vi.mock` for nested components only.

### 7. Don't put query strings in the handler `path`

`addAPIMock` accepts `?foo=bar` suffixes via `TrimQueryParams`, but the
helper strips them before matching. MSW v2 doesn't match query params via
path strings — read them inside the resolver instead:

```ts
addAPIMock({
  method: 'get',
  path: '/platform/projects',
  response: ({ request }) => {
    const limit = new URL(request.url).searchParams.get('limit')
    // ...
  },
})
```

### 8. Always pass an explicit generic to `HttpResponse.json`

`addAPIMock`'s resolver is typed against the OpenAPI success body (and the
standard `{ message: string }` error envelope, exported as `APIErrorBody`).
But MSW's `HttpResponse.json` uses `NoInfer`, so the body type doesn't
narrow from context. Pass the expected shape explicitly — it doubles as a
self-documenting contract assertion:

```ts
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

response: () => HttpResponse.json<OrganizationResponse[]>([...])
response: () =>
  HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 })
```

A mock that drifts from the contract (wrong envelope, missing fields,
stale enum values) now fails at compile time, not at runtime. The cost is
one type annotation per resolver — well worth it.

For mocks at the network boundary, also prefer `createMockOrganizationResponse`
(returns the raw OpenAPI `OrganizationResponse`) over `createMockOrganization`
(which extends with frontend-derived `managed_by` / `partner_id` that the
query layer attaches). Same pattern applies to any type that's a frontend
extension of an OpenAPI schema: build a `createMockXResponse` helper that
returns the raw API shape.

## Prefer asserting on UI state

MSW's own best-practices doc explicitly recommends asserting on what
renders, not on whether a handler was called. The "did the form
submit?" question is best answered by `expect(onClose).toHaveBeenCalled()`
or by `findByText('Saved')` — not by spying on the resolver.

There's one legitimate exception: **the request body itself is the
contract you care about**, and the server's reply doesn't reflect it
back. Bulk-create endpoints (like `POST /v1/projects/:ref/secrets`) are
the canonical case — 201 with no body, so the only way to verify the
shape sent is to capture it:

```ts
const requests: Array<{ ref: string | undefined; body: unknown }> = []
addAPIMock({
  method: 'post',
  path: '/v1/projects/:ref/secrets',
  response: async ({ request, params }) => {
    requests.push({ ref: params.ref as string | undefined, body: await request.json() })
    return HttpResponse.json<CreateSecretsResponse>({}, { status: 201 })
  },
})

// ... drive the UI ...

expect(requests).toEqual([{ ref: 'default', body: [{ name: 'API_KEY', value: 'new-value' }] }])
```

When in doubt, assert on the UI first; reach for request capture only
when the UI doesn't observably encode the contract.

## Debugging an MSW test

If a request isn't being matched, wire up MSW's lifecycle events at the
top of the test file (or temporarily in `msw.ts`):

```ts
import { mswServer } from '@/tests/lib/msw'

mswServer.events.on('request:unhandled', ({ request }) => {
  console.log('[MSW] UNHANDLED:', request.method, request.url)
})
mswServer.events.on('response:mocked', ({ request, response }) => {
  console.log('[MSW] MATCHED:', request.method, request.url, response.status)
})
```

`request:start` is already wired in `msw.ts`. Add `request:unhandled` and
`response:mocked` locally when a test misbehaves — usually surfaces a
path-param mismatch or a nested query you forgot to mock.

## Why not `vi.mock('@/data/...')`

It bypasses the network boundary, so:

- It hides real bugs: a renamed query key or a changed request payload
  passes the test, then breaks in production.
- It doesn't exercise React Query's caching, retry, or invalidation
  paths — `onMutate`, `onSuccess`, and `onError` callbacks won't run as
  they do in real life. ([tkdodo.eu/blog/testing-react-query](https://tkdodo.eu/blog/testing-react-query))
- It drifts independently from the OpenAPI types — handlers stay in sync,
  module-level mocks don't.

Reach for `vi.mock` only for non-network concerns: a heavy child
component (e.g. a Monaco editor) you want to stub, or a `common`-package
hook with global state.

## Further reading

- [TkDodo — Testing React Query](https://tkdodo.eu/blog/testing-react-query) —
  canonical reference for the principles behind everything in this skill.
- [MSW best practices: structuring handlers](https://mswjs.io/docs/best-practices/structuring-handlers/)
  and [overriding network behavior](https://mswjs.io/docs/best-practices/network-behavior-overrides/) —
  the baseline-handlers + per-test-`server.use()` pattern.
- [MSW best practices: avoid request assertions](https://mswjs.io/docs/best-practices/avoid-request-assertions/) —
  the source of the "assert on UI state" guidance above.

## Codebase references

| What                                                           | Where                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Query-only example (loading, error, success)                   | `apps/studio/components/interfaces/Organization/OrgNotFound.test.tsx`                                   |
| Mutation example (form, payload assertion)                     | `apps/studio/components/interfaces/Functions/EdgeFunctionSecrets/EditSecretSheet.test.tsx`              |
| SQL-via-pg-meta example (POST resolver branch on `query` body) | `apps/studio/components/interfaces/Integrations/Vault/Secrets/__tests__/EditSecretModal.test.tsx`       |
| `addAPIMock` source                                            | `apps/studio/tests/lib/msw.ts`                                                                          |
| `customRender` source                                          | `apps/studio/tests/lib/custom-render.tsx`                                                               |
| Global handlers + lifecycle                                    | `apps/studio/tests/lib/msw-global-api-mocks.ts`, `apps/studio/tests/vitestSetup.ts`                     |
| Related skills                                                 | `studio-testing` (when to write a component test at all), `studio-queries` (hook conventions), `vitest` |
