# Account recovery advisor spike

Local branch: `dnywh/account-recovery-advisors`.

## Previewing the mock

Run Studio in development and append `?mockAccountAdvisor=exhausted` to any dashboard URL. If the URL already has query parameters, append `&mockAccountAdvisor=exhausted` instead.

Open Advisor Center and select **Regenerate account recovery codes**. The example represents one verified authenticator and no unused recovery codes. It appears under Security with Account scope and links to the recovery codes section of Account Security.

The mock bypasses the recovery-code feature flag and account reads for this advice. It does not change the account or generate recovery codes. It is disabled outside development.

Remove the query parameter and reload to restore real account evaluation. The preview switch lives in `useAccountRecoveryAdvice.ts`.

## Scope and validation

This spike adds account recovery advice using existing authenticated APIs. It excludes SSO accounts, waits for successful reads, and scopes cached data by user. Missing or exhausted codes are critical with one verified factor and warning with multiple verified factors. One remaining code is informational and hidden by the default severity filter.

Studio typechecking and 25 focused tests passed after separating the branches. The mock was verified in the local Advisor Center without a selected project.

Account recovery advice is a `signal` with `scope: 'account'`. Banned IP signals use `scope: 'project'` and retain their separate dismissal behavior. Account recovery advice cannot be dismissed and clears when the account status resolves. Other account security settings work remains in the UX branch.

Interstitials, reminder cadence, cross-device snooze, and email delivery are outside this spike.
