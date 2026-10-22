# Account recovery advisor spike

Local branch: `dnywh/account-recovery-advisors`.

## Previewing the mock

Open Studio in development or a Vercel preview deployment and append `?mockAccountAdvisor=exhausted` to any dashboard URL. If the URL already has query parameters, append `&mockAccountAdvisor=exhausted` instead. The supported values are `exhausted`, `missing`, `low`, `single-identity`, and `single-factor`.

Open Advisor Center and select **Regenerate account recovery codes**. The example represents one verified authenticator and no unused recovery codes. It appears under Security with Account scope and links to the recovery codes section of Account Security.

The mock disables live account reads for the advice and evaluates the selected case through the shared recovery evaluator. It does not change the account or generate recovery codes. It is disabled in production deployments.

Remove the query parameter and reload to restore real account evaluation. The preview switch lives in `useAccountRecoveryAdvice.ts`.

## Scope and validation

This spike maps the five shared account recovery findings from the evaluator branch into Advisor Center signals. The shared hook uses existing authenticated APIs, excludes SSO accounts, waits for successful reads, and scopes cached data by user. Missing codes are warning with any verified MFA factor. Exhausted codes are critical and one to three remaining codes are warning when there is exactly one verified MFA factor. A single factor is informational when code status is safe; a single external sign-in method can recommend adding a password. Info items are included in the default severity filter, including existing Info advisories.

Studio typechecking and focused tests passed after integrating the shared evaluator. The earlier exhausted-code preview was verified in the local Advisor Center without a selected project; the five preview variants are covered by tests.

Account recovery advice is a `signal` with `scope: 'account'`. Banned IP signals use `scope: 'project'` and retain their separate dismissal behavior. Account recovery advice cannot be dismissed and clears when the account status resolves. Other account security settings work remains in the UX branch.

Interstitials, reminder cadence, cross-device snooze, and email delivery are outside this spike.
