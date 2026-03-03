# DEPR-340 Backend Integration Tracker (Platform Webhooks)

Context:
- PR: #43276
- Ticket: DEPR-340
- Current state: feature-flagged frontend mock implementation with no backend integration yet.

## Purpose

Track temporary client-side mock scaffolding that must be removed or swapped when Platform Webhooks backend integration is implemented.

## Remove/Swap on Backend Integration

- [ ] Replace local mock store writes (`createEndpoint`, `updateEndpoint`, `deleteEndpoint`, `toggleEndpoint`, `regenerateSecret`) with backend query/mutation flows.
- [ ] Remove client-side signing secret generation (`generateSigningSecret`) and only use backend-provided signing secrets.
- [ ] Remove client-side endpoint/header ID generation once backend returns canonical IDs.
- [ ] Replace mock fallback metadata (`createdBy`, `createdAt`) with backend-authored values.
- [ ] Remove mock seed bootstrap (`createInitialPlatformWebhooksState` deep clone of `PLATFORM_WEBHOOKS_MOCK_DATA`) once real data-fetching is wired.
- [ ] Rework `regenerateSecret` UX flow for backend behavior:
  - one-time reveal semantics
  - loading and error states
  - backend failure handling and retry
- [ ] Delete this tracker file after all checklist items are complete and verified.

## Acceptance Criteria Before Deleting This File

- [ ] Platform Webhooks UI reads endpoint and delivery data from backend APIs only.
- [ ] All create/update/delete/toggle/regenerate actions call backend APIs and handle success/error states.
- [ ] No mock-only random ID/secret generation remains in production code paths.
- [ ] Relevant tests cover backend-integrated flows and no longer rely on mock seed state for primary behavior.
- [ ] Feature flag graduation/removal plan is documented and agreed for DEPR-340.
