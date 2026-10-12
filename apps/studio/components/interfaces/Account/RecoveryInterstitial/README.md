# Account recovery interstitial spike

Independent spike on `dnywh/account-recovery-interstitial`, based on master.

## Local preview

- Exhausted codes: `http://localhost:8082/account-recovery?mockRecoveryInterstitial=exhausted&returnTo=%2Forganizations`
- Missing codes: `http://localhost:8082/account-recovery?mockRecoveryInterstitial=missing&returnTo=%2Forganizations`
- Add `&mockRecoveryTasks=codes` for a codes-only list. By default both recovery codes and the optional backup authenticator task are shown.
- Replace `returnTo` with an encoded local project or organization URL to test returning there.

Mock state is accepted only in development. It bypasses eligibility and flags and uses deliberately invalid preview codes. Generate and regenerate open the same confirmation and save-code dialogs as Account Security, without calling the authentication service or changing your account. Add authenticator opens an inert preview dialog with no real QR code or auth mutation.

The live reminder generates or regenerates codes directly in the existing dialogs. Regeneration requires confirmation. Completion requires the save acknowledgement and closing with Done; creation alone does not resolve the reminder. Errors can be closed and retried. Each completed row remains visible. Adding an authenticator is recommended and completes only after successful verification, independently of saving codes. Canceling either flow leaves its row unresolved. Continue to dashboard remains available and returns to the original destination. The dialog remains mounted during background recovery-status updates.

Without the mock parameter, the authenticated route reads current account state. It waits for successful identity, factor, and code reads, excludes managed SSO accounts, and requires the recovery-code flag and Account Security availability. It shows missing or exhausted codes only when exactly one verified non-recovery factor exists. Low codes do not trigger this reminder.

## Spike limits

No automatic navigation interception or snooze persistence is wired. Visit the route directly to preview. No backend changes are required for this slice. Cross-device reminder cadence would require durable account-level storage; browser-local persistence would not provide that guarantee.

The advisor and account settings spikes remain independent. Their evaluation logic can be consolidated when the pieces are integrated.
