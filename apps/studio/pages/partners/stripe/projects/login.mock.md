# Mock states — Stripe Projects login page

> Design review and prototyping guide for `login.tsx`.
> These mocks bypass all API calls. No real `ar_id` or auth token needed.

## Quick links (local dev on port 8082)

| State                        | URL                                                                       |
| ---------------------------- | ------------------------------------------------------------------------- |
| Request / approval (new org) | `http://localhost:8082/partners/stripe/projects/login?mock=pending`       |
| Already-linked org           | `http://localhost:8082/partners/stripe/projects/login?mock=linked`        |
| Wrong account                | `http://localhost:8082/partners/stripe/projects/login?mock=wrong-account` |
| Success                      | `http://localhost:8082/partners/stripe/projects/login?mock=success`       |

A small `mock: <state>` badge is pinned top-right whenever a mock URL is active.

---

## How it works

The `?mock=<state>` query param is read in `login.tsx` at runtime. When present:

1. The real `useQuery(accountRequestQueryOptions(...))` is disabled (`enabled: false`) — no network request is made.
2. `useConfirmAccountRequestMutation` is still instantiated but never called — the `handleApprove` function short-circuits into a fake 1.2 s spinner then sets local state.
3. All render-branch variables (`isPending`, `isSuccess`, `isConfirmed`, etc.) are replaced with `effective*` equivalents that are driven by the mock data instead of query/mutation state.

### Key variables

```
isMockMode        boolean — true when ?mock= is a known key
mockParam         'pending' | 'linked' | 'wrong-account' | 'success'
mockConfirming    useState — fake loading state for the confirm button
mockConfirmed     useState — fake success state after clicking Approve/Continue
effectiveAccountRequest   — MOCK_RESPONSES[mockParam] or real query data
effectiveIsPending        — always false in mock mode
effectiveIsSuccess        — true for all mock states except 'success'
effectiveIsConfirmed      — true when mockParam === 'success' OR mockConfirmed is set
effectiveIsConfirming     — driven by mockConfirming state
effectiveIsError          — always false in mock mode
```

---

## Mock response shapes

These live in `MOCK_RESPONSES` at the top of `login.tsx` and match `AccountRequestDetailsDto`
from `apps/studio/data/partners/stripe-projects-query.ts`.

### `pending` — new org approval (main request screen)

```json
{
  "id": "mock",
  "email": "jane@acmecorp.io",
  "email_matches": true,
  "status": "pending",
  "expires_at": "<1 hour from page load>",
  "linked_organization": null
}
```

Renders: heading + "A new Supabase organization will be created..." + **Approve** button.

### `linked` — org already connected to Stripe

```json
{
  "id": "mock",
  "email": "jane@acmecorp.io",
  "email_matches": true,
  "status": "pending",
  "expires_at": "<1 hour from page load>",
  "linked_organization": { "id": 42, "name": "Acme Corp", "slug": "acme-corp" }
}
```

Renders: "Acme Corp is already linked to your Stripe account." + **Continue** button.

### `wrong-account` — signed in as the wrong user

```json
{
  "id": "mock",
  "email": "jane@acmecorp.io",
  "email_matches": false,
  "status": "pending",
  "expires_at": "<1 hour from page load>",
  "linked_organization": null
}
```

Renders: warning alert "You need to be logged in as jane@acmecorp.io" + **Sign out** button.

### `success` — post-confirm / window-close screen

Uses the `pending` shape but bypasses `effectiveIsSuccess` entirely — `effectiveIsConfirmed`
is set to `true` directly.

Renders: "Organization Created" heading + "You can close this window."

---

## The real API

For reference, the real flow hits:

- **GET** `/platform/stripe/projects/provisioning/account_requests/{id}` → `AccountRequestDetailsDto`
- **POST** `/platform/stripe/projects/provisioning/account_requests/{id}/confirm` → no body required

Both routes are in `apps/studio/data/partners/stripe-projects-query.ts` and
`apps/studio/data/partners/stripe-projects-confirm-mutation.ts`.

The `ar_id` param arrives as a query string from Stripe's deeplink redirect.
Studio passes it straight to mgmt-api, which talks to Stripe — so a real `ar_id`
cannot be obtained locally without a live Stripe-issued token.

---

## Changing mock data

Edit `MOCK_RESPONSES` near the top of `login.tsx`. The object keys are the valid `?mock=` values.
To add a new state, add a key there and it will be accepted automatically (the `in` check is dynamic).
