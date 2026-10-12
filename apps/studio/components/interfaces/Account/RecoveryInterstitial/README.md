# Account recovery interstitial spike

Independent spike on `dnywh/account-recovery-interstitial`, based on master.

## Local preview

- Exhausted codes: `http://localhost:8082/account-recovery?mockRecoveryInterstitial=exhausted&returnTo=%2Forganizations`
- Missing codes: `http://localhost:8082/account-recovery?mockRecoveryInterstitial=missing&returnTo=%2Forganizations`
- Replace `returnTo` with an encoded local project or organization URL to test returning there.

Mock state is accepted only in development. It bypasses eligibility and flags for this reminder only. Review account security opens real Account Security settings. It does not generate codes automatically. The existing Back to dashboard navigation retains the original destination. The existing generation and regeneration controls remain responsible for code setup.

Without the mock parameter, the authenticated route reads current account state. It waits for successful identity, factor, and code reads, excludes managed SSO accounts, and requires the recovery-code flag and Account Security availability. It shows missing or exhausted codes only when exactly one verified non-recovery factor exists. Low codes do not trigger this reminder.

## Spike limits

No automatic navigation interception or snooze persistence is wired. Visit the route directly to preview. No backend changes are required for this slice. Cross-device reminder cadence would require durable account-level storage; browser-local persistence would not provide that guarantee.

The advisor and account settings spikes remain independent. Their evaluation logic can be consolidated when the pieces are integrated.
