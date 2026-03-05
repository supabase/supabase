---
title = "'OTP Verification Failures: 'token has expired' or 'otp_expired' errors'"
topics = [ "auth", "cli" ]
keywords = []
database_id = "25eddb73-3cca-485b-b87f-7279dd46b7a7"

[[errors]]
http_status_code = 403
message = "Forbidden"

[[errors]]
code = "otp_expired"
message = "OTP expired"
---

When users attempt to exchange One-Time Passwords (OTPs), they may encounter various errors indicating that the token is no longer valid. These include messages like "token has expired or is invalid," "Email link is invalid or has expired," or they might receive '403 Forbidden' HTTP responses on the verification endpoint. Authentication logs often show specific `otp_expired` error codes.

## What is OTP (one-time password) verification?

An OTP, or One-Time Password, is a security code generated for a single use or a limited period. In authentication flows, especially for password resets, a user requests an OTP, which is then sent to their email or phone. The user must then provide this OTP back to the system within a set timeframe to verify their identity and proceed with actions like resetting a password. The system verifies this token using a function like `supabase.auth.verifyOtp({ email, token, type: 'recovery' })`.

## Understanding the errors

- **403 Forbidden HTTP Status Code:** This is a standard HTTP status code indicating that the web server understood the request but refuses to authorize it. In the context of OTP verification, a 403 Forbidden response on the `/verify` endpoint typically means the server has rejected the submitted OTP token, often because it's invalid, expired, or used.
- **`otp_expired` Error:** This is a specific error message reported by the authentication service, explicitly stating that the provided OTP token has passed its validity period and can no longer be used. Other similar messages like "token has expired or is invalid" or "Email link is invalid or has expired" also fall under this category of token validity issues.

## The root cause: Email prefetching

The most common reason for OTP tokens appearing expired or invalid before a user can even use them is **email prefetching**.

- **What is email prefetching?** Email prefetching is a mechanism used by email clients or security tools to automatically scan and sometimes access URLs embedded in emails. This is often done to check for malicious links, render content faster, or provide advanced security features.
- **How security tools interfere:** Services such as security tools commonly used by organizations (e.g., for safe link analysis), or similar security scanners, automatically 'click' or access links within emails to analyze their content or check for threats. If your password reset email includes a confirmation URL (sometimes referred to as a "magic link" or a link that implicitly validates the token upon access), these automated prefetching services can consume the OTP token by accessing the link _before_ the legitimate user does. This makes the token appear instantly expired or invalid to the user, as it has already been used or invalidated by the prefetcher.
- **System clock issues:** Less frequently, discrepancies between a user's device system clock and the server's time can lead to tokens appearing invalid due to perceived expiration, though this is less common with modern synchronized systems.

## Troubleshooting and identifying the problem

To determine if email prefetching or another token validity issue is the root cause, you can correlate events across your logs:

1.  **Monitor API Logs:** Look for '403 Forbidden' HTTP status codes on the `/verify` endpoint. These responses directly indicate failed verification attempts.
2.  **Check Authentication Logs:** Cross-reference the API log entries with your authentication logs for `otp_expired` error codes or similar "token invalid/expired" messages.
3.  **Correlate by Time and IP:** Use timestamps and, if available, IP addresses from both API and authentication logs to link specific failed verification attempts to potential prefetching events. If you see rapid 403 errors or `otp_expired` messages shortly after an email is sent, but before a user could reasonably click the link, it strongly suggests prefetching.
4.  **Confirm Verification Method:** Ensure your application uses the intended OTP verification method, such as `supabase.auth.verifyOtp` with the correct type (e.g., `recovery` for password resets). While it's understood that the 'recovery' type is correct for password resets, the issue primarily stems from the initial link access rather than the final verification call.

## Resolving the issue

Addressing this problem typically involves adjusting how your application interacts with email and how tokens are handled:

1.  **Review Email Templates:** Carefully inspect your password reset email templates. Identify if they contain confirmation URLs (e.g., `{{ .ConfirmationURL }}`) that, when accessed, might implicitly validate or invalidate an OTP token.
2.  **Implement Prefetching Bypasses/Mitigation:**
    - **Consult Email Service Documentation:** Refer to the documentation for your email service provider or any integrated security tools. Many services offer methods to prevent or mitigate automated prefetching, such as specific HTML attributes (e.g., `rel="noreferrer noopener"`) or email headers that signal security scanners not to follow links.
    - **Delay Token Invalidation:** Consider if your system can be configured to invalidate the OTP token only _after_ a user explicitly submits it, rather than upon initial access of a confirmation URL.
    - **Re-evaluate Link Structure:** If using confirmation URLs, explore alternative designs where the link only directs the user to a page to _enter_ the OTP, rather than consuming it directly.
3.  **Educate Users:** Inform users that they should not forward password reset emails and should click links directly.
4.  **Consider OTP Flow without Direct Links:** If prefetching remains a persistent issue, consider an OTP flow that relies solely on users manually copying a code from the email into your application, bypassing any clickable confirmation URLs for the sensitive part of the process.
