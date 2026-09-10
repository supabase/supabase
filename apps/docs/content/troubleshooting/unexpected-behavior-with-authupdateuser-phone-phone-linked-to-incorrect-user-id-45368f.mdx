---
title = "`Unexpected behavior with 'auth.updateUser({ phone })': Phone linked to incorrect user ID`"
topics = [ "auth" ]
keywords = []
---

When using `auth.updateUser({ phone: '...' })`, you might observe that a phone number is unexpectedly linked to a different `auth.users` record than the currently authenticated user during the phone verification process, even if `auth.getUser()` reports the correct user ID beforehand.

**Why does this happen?**
Supabase phone verification identifies the user by searching for the provided phone number in the `phone_change` column, rather than relying solely on the active session. Unlike the `phone` column, the `phone_change` column does not enforce uniqueness. If multiple `auth.users` records contain the same phone number in `phone_change` due to uncompleted or abandoned verification attempts, the system may update an unintended user's `phone` field upon successful OTP verification. This occurs because the system finds and updates the first matching record in `phone_change`, which might not belong to the currently authenticated user.

**How to prevent/resolve this:**
To prevent ambiguous lookups from abandoned verification attempts, implement application-level cleanup to remove stale `phone_change` values from your `auth.users` records.

1.  **Define a grace period:** Establish a reasonable time frame after which an unconfirmed phone verification attempt is considered stale.
2.  **Identify stale records:** Periodically query `auth.users` to find accounts where `phone_verified` is `false` and the `phone_change` value has been present beyond your defined grace period.
3.  **Clear `phone_change`:** For identified stale records, clear their `phone_change` value. This ensures that only active and unique `phone_change` entries are considered during verification.
