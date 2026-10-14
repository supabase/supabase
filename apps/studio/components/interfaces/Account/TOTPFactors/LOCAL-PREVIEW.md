# Recovery-code preview marker

Temporary preview entry points for Account / Security:

| Query value   | Preview                                                             |
| ------------- | ------------------------------------------------------------------- |
| `0`           | Exhausted codes, one authenticator. Critical warning.               |
| `1`, `2`, `3` | Low codes, one authenticator. Warning.                              |
| `missing`     | No codes generated, one authenticator. Warning and generation flow. |
| `healthy`     | Ten codes, one authenticator. Backup-authenticator warning.         |
| `backup`      | Ten codes, two authenticators. No recovery warning.                 |
| `mfa-off`     | No authenticators. MFA and recovery-code prerequisite empty states. |

Open `http://localhost:8082/account/security?mockRecoveryCodes=VALUE`, replacing `VALUE` with any value above. For example:

- http://localhost:8082/account/security?mockRecoveryCodes=0
- http://localhost:8082/account/security?mockRecoveryCodes=1
- http://localhost:8082/account/security?mockRecoveryCodes=2
- http://localhost:8082/account/security?mockRecoveryCodes=3
- http://localhost:8082/account/security?mockRecoveryCodes=missing
- http://localhost:8082/account/security?mockRecoveryCodes=healthy
- http://localhost:8082/account/security?mockRecoveryCodes=backup
- http://localhost:8082/account/security?mockRecoveryCodes=mfa-off

The query parameter works in development on localhost or 127.0.0.1, and in Vercel deploy previews where `NEXT_PUBLIC_VERCEL_ENV=preview`. Use the same `/account/security?mockRecoveryCodes=VALUE` paths on the deploy preview URL. Invalid values and production deployments use live account state. Preview findings use the shared evaluator.

The MFA and recovery sections use local sample data, not the account query cache. Their preview actions must never call Auth mutations. Sign-in methods still show live account data and keep their normal actions.

Remove the query parameter to return to live MFA and recovery state.

## Cleanup

When this preview is no longer needed, remove `RecoveryCodesPreview.utils.ts`, its tests, the preview-only flow, and the preview branches in `pages/account/security.tsx` and `TOTPFactors/index.tsx`. Remove this marker last.

## Account Security layout decision

Keep configured sign-in methods, authenticators and recovery-code counts in stable rows. Supplement those rows with contextual admonitions above them; do not move management controls into the warnings. Keep one action entry point rather than repeat the same button in the warning and row.

An account email without a password is not a configured sign-in method. Offer password setup in an admonition outside the methods list. Keep the email icon and row styling for configured email sign-in.

For exhausted codes, use: "Generate a new set so you have a backup way to sign in." The warning must not imply the user still has codes left.
