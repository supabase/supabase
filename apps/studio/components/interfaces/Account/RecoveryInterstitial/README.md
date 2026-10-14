# Account recovery interstitial spike

Independent spike on `dnywh/account-recovery-interstitial`, based on master.

## Local preview

- Exhausted codes: `http://localhost:8082/account-recovery?mockRecoveryInterstitial=exhausted&returnTo=%2Forganizations`
- Missing codes: `http://localhost:8082/account-recovery?mockRecoveryInterstitial=missing&returnTo=%2Forganizations`
- Add `&mockRecoveryTasks=codes` for a codes-only list. By default both recovery codes and the optional backup authenticator task are shown.
- Replace `returnTo` with an encoded local project or organization URL to test returning there.

Mock state is accepted in development and Vercel preview deployments (`NEXT_PUBLIC_VERCEL_ENV=preview`). It is disabled on production deployments. Use the same query parameters on the deploy preview URL. It bypasses eligibility and flags and uses deliberately invalid preview codes. Generate and regenerate open the same confirmation and save-code dialogs as Account Security, without calling the authentication service or changing your account. Add authenticator opens an inert preview dialog with no real QR code or auth mutation.

The live reminder generates or regenerates codes directly in the existing dialogs. Regeneration requires confirmation. Completion requires the save acknowledgement and closing with Done; creation alone does not resolve the reminder. Errors can be closed and retried. Each completed row remains visible. Adding an authenticator is recommended and completes only after successful verification, independently of saving codes. Canceling either flow leaves its row unresolved. Continue to dashboard remains available and returns to the original destination. The dialog remains mounted during background recovery-status updates.

Without the mock parameter, the authenticated route uses the shared account recovery findings. It requires the recovery-code flag and Account Security availability. This interstitial selects only missing or exhausted recovery codes. Low codes, a single MFA factor, and a single OAuth identity do not trigger the reminder. The shared evaluator handles account eligibility and SSO exclusion.

## Spike limits

No automatic navigation interception or snooze persistence is wired. Visit the route directly to preview. No backend changes are required for this slice. Cross-device reminder cadence would require durable account-level storage; browser-local persistence would not provide that guarantee.

The advisor, account settings, and interstitial surfaces select from the shared recovery findings.
