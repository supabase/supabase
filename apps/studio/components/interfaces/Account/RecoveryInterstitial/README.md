# Account recovery interstitial

The interstitial uses the signed-in account's recovery state and existing setup dialogs. There are no runtime mock parameters. Account Security and Advisors remain separate delivery work.

## Test with Chrome DevTools

Use a dedicated staging test account with MFA enabled and complete sign-in first. Open the deploy preview's `/dashboard/account-recovery?returnTo=%2Forganizations` route, or `/account-recovery?returnTo=%2Forganizations` locally when no base path is configured.

1. In Chrome DevTools, open Network and enable Preserve log. Filter for `recovery-codes`.
2. For an account that already has codes, right-click the GET request ending in `/factors/recovery-codes`, choose Override content, and select a local overrides folder when prompted.
3. Keep the existing JSON fields and change `remaining` to `0`. Save and reload. With one verified authenticator, the exhausted-code task should appear. Restore a healthy count to test the all-clear state. These overrides affect this browser only.
4. For the missing-code state, use a staging account that has MFA but has never generated recovery codes. The API returns `mfa_factor_not_found`; changing a successful response body alone does not reproduce that error status.
5. Use Network request blocking on the status request to check the unavailable state. It must not show “You’re all set”. Disable blocking afterwards.
6. Remove or disable the overrides and reload before testing live generation, regeneration or authenticator enrollment. These actions use the actual authentication service and change the test account. Verify regeneration cancellation leaves existing codes intact, and Done requires the save acknowledgement.
7. Verify Continue returns to `/dashboard/organizations` on the preview, or `/organizations` locally. Query strings and fragments must survive.

Chrome's instructions: https://developer.chrome.com/docs/devtools/overrides

For isolated dialog tests without real account mutations, use the component tests. They mock authentication responses at the test boundary; those mocks are not part of the application.

## Automatic reminders and rollout

The ConfigCat flag `enableAccountRecoveryInterstitial` gates automatic interruption, alongside recovery-code availability and Account Security access. Both Studio runtimes wait for MFA verification and successful recovery reads. Account, sign-in, consent and connection flows are excluded.

Skip for now snoozes missing codes for thirty days or exhausted codes for seven. Escalation breaks snooze. Storage is versioned and user-scoped, survives sign-out, and falls back to memory if unavailable. No recovery codes are stored. Other browsers and devices have independent reminders.

Saved codes resolve either gap; another verified factor resolves an exhausted-code gap. The optional authenticator task appears only with one verified factor and never triggers an interruption alone. Completed rows stay visible during background updates.

Telemetry records reminder exposure, task actions, completion and exit. No backend changes are required; cross-device cadence would need account-level persistence.
