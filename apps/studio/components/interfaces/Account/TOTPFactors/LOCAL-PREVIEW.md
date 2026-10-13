# Recovery-code preview marker

Temporary preview entry points for Account / Security:

- http://localhost:8082/account/security?mockRecoveryCodes=1
- http://localhost:8082/account/security?mockRecoveryCodes=2

Both show one verified authenticator and the selected number of remaining recovery codes. The query parameter works only in development on localhost or 127.0.0.1. Invalid values, production builds and remote hosts use live account state.

The MFA and recovery sections use local sample data, not the account query cache. Their preview actions must never call Auth mutations. Sign-in methods still show live account data and keep their normal actions.

Remove the query parameter to return to live MFA and recovery state.

## Cleanup

When this preview is no longer needed, remove `RecoveryCodesPreview.utils.ts`, its tests, the preview-only flow, and the preview branches in `pages/account/security.tsx` and `TOTPFactors/index.tsx`. Remove this marker last.
