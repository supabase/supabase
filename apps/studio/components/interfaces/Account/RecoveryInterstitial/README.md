# Account recovery interstitial

Independent delivery on `dnywh/account-recovery-interstitial`, based on master.

## Local preview

- Exhausted codes: `http://localhost:8082/account-recovery?mockRecoveryInterstitial=exhausted&returnTo=%2Forganizations`
- Missing codes: `http://localhost:8082/account-recovery?mockRecoveryInterstitial=missing&returnTo=%2Forganizations`
- Add `&mockRecoveryTasks=codes` for a codes-only list. By default both recovery codes and the optional backup authenticator task are shown.
- Replace `returnTo` with an encoded local project or organization URL to test returning there.

Mock state is accepted in development and Vercel preview deployments (`NEXT_PUBLIC_VERCEL_ENV=preview`). It is disabled on production deployments. Use the same query parameters on the deploy preview URL. It bypasses eligibility and flags and uses deliberately invalid preview codes. Generate and regenerate open the same confirmation and save-code dialogs as Account Security, without calling the authentication service or changing your account. Add authenticator opens an inert preview dialog with no real QR code or auth mutation.

The live reminder generates or regenerates codes directly in the existing dialogs. Regeneration requires confirmation. Completion requires the save acknowledgement and closing with Done; creation alone does not resolve the reminder. Errors can be closed and retried. Each completed row remains visible. Adding an authenticator is recommended and completes only after successful verification, independently of saving codes. Canceling either flow leaves its row unresolved. Continue to dashboard remains available and returns to the original destination. The dialog remains mounted during background recovery-status updates.

Without the mock parameter, the authenticated route uses the shared account recovery findings. It requires the recovery-code flag and Account Security availability. This interstitial selects only missing or exhausted recovery codes. Low codes, a single MFA factor, and a single OAuth identity do not trigger the reminder. The shared evaluator handles account eligibility and SSO exclusion.

## Automatic reminders and rollout

Create the ConfigCat boolean flag `enableAccountRecoveryInterstitial`, defaulting to false. Enable it for internal test accounts first, then roll out gradually after verifying recovery-code availability. Automatic interruption also requires `enableAuthRecoveryCodes` and Account Security availability. The direct authenticated route and inert mocks remain available independently of the rollout flag.

The shared controller is mounted in both Next.js and TanStack Start. It waits for a verified authenticated session and successful recovery reads. It checks dashboard organization, project, and creation routes; account settings, sign-in, MFA verification, consent and connection routes are excluded. Return destinations retain their query string and fragment.

Skip for now snoozes the aggregated reminder for seven days when codes are exhausted, or thirty days when codes are missing. Escalation from missing to exhausted breaks the snooze. Browser storage is versioned and scoped to the signed-in user, survives sign-out, and falls back to memory when unavailable. No codes are stored. Other browsers and devices have independent reminders.

Completed tasks stay visible. On exit, unresolved code gaps are snoozed; saved codes resolve either gap, and a verified backup factor resolves an exhausted-code gap. Another factor alone never causes an interruption. Only accounts with exactly one verified factor see that optional task.

Telemetry records rollout exposure, task starts, successful completion, and exits with completion state. Mocks send no events and write no reminder state. No backend changes are required. Cross-device cadence would require durable account-level storage.

The advisor, account settings, and interstitial surfaces select from the shared recovery findings.
