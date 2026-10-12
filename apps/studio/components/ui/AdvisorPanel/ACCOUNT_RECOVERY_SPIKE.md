# Account recovery advisor spike

Local branch: `dnywh/account-recovery-advisors`.

## Previewing the mock

Run Studio in development and append `?mockAccountAdvisor=exhausted` to any dashboard URL. If the URL already has query parameters, append `&mockAccountAdvisor=exhausted` instead.

Open Advisor Center and select **Regenerate account recovery codes**. The example represents one verified authenticator and no unused recovery codes. It appears under Security with Account scope.

The mock bypasses the recovery-code feature flag and account reads for this advice. It does not change the account or generate recovery codes. It is disabled outside development.

Remove the query parameter and reload to restore real account evaluation. The preview switch lives in `useAccountRecoveryAdvice.ts`.

## Scope and validation

This spike adds account recovery advice using existing authenticated APIs. It excludes SSO accounts, waits for successful reads, and scopes cached data by user. Missing or exhausted codes are critical with one verified factor and warning with multiple verified factors. One remaining code is informational and hidden by the default severity filter.

Studio typechecking and 13 focused tests passed. The mock was verified in the local Advisor Center without a selected project.

Interstitials, reminder cadence, cross-device snooze, and email delivery are outside this spike. The separate `account` source is provisional; a broader signal model could represent account scope and dismissal behavior explicitly.
