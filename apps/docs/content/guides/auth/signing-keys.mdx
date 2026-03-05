---
id: 'auth-signing-keys'
title: 'JWT Signing Keys'
subtitle: 'Best practices on managing keys used by Supabase Auth to create and verify JSON Web Tokens'
---

Supabase Auth continuously issues a new JWT for each user session, for as long as the user remains signed in. JWT signing keys provide fine grained control over this important process for the security of your application.

Before continuing check the comprehensive guide on [Sessions](/docs/guides/auth/sessions) for all the details about how Auth creates tokens for a user's session. Read up on [JWTs](/docs/guides/auth/jwts) if you are not familiar with the basics.

## Overview

When a JWT is issued by Supabase Auth, the key used to create its [signature](https://en.wikipedia.org/wiki/Digital_signature) is known as the signing key. Supabase provides two systems for dealing with signing keys: the Legacy system based on the JWT secret, and the new Signing keys system.

| System            | Type                                       | Description                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy            | JWT&nbsp;secret                            | Initially Supabase was designed to use a single shared secret key to sign all JWTs. This includes <span className="!whitespace-nowrap">the `anon` and `service_role`</span> keys, all user access tokens including some [Storage pre-signed URLs](/docs/reference/javascript/storage-from-createsignedurl). **No longer recommended.** Available for backward compatibility. |
| Signing&nbsp;keys | Asymmetric&nbsp;key (RSA, Elliptic Curves) | A JWT signing key based on [public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography) (RSA, Elliptic Curves) that follows industry best practices and significantly improves the security, reliability and performance of your applications.                                                                                                           |
| Signing&nbsp;keys | Shared&nbsp;secret&nbsp;key                | A JWT signing key based on a [shared secret](https://en.wikipedia.org/wiki/HMAC).                                                                                                                                                                                                                                                                                            |

### Benefits of the signing keys system

We've designed the Signing keys system to address many problems the legacy system had. It goes hand-in-hand with the [publishable and secret API keys](/docs/guides/api/api-keys).

| Benefit                                     | Legacy JWT secret                                                                                                | JWT signing keys                                                                                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance                                 | Increased app latency as JWT validation is done by Auth server.                                                  | If using asymmetric signing key, JWT validation is fast and does not involve Auth server.                                                                                              |
| Reliability                                 | To ensure secure revocation, Auth server is in the hot path of your application.                                 | If using asymmetric signing key, JWT validation is local and fast and does not involve Auth server.                                                                                    |
| Security                                    | Requires changing of your application's backend components to fully revoke a compromised secret.                 | If using asymmetric signing key, revocation is automatic via the key discovery endpoint.                                                                                               |
| Zero-downtime rotation                      | Downtime, sometimes being significant. Requires careful coordination with [API keys](/docs/guides/api/api-keys). | No downtime, as each rotation step is independent and reversible.                                                                                                                      |
| Users signed out during rotation            | Currently active users get immediately signed out.                                                               | No users get signed out.                                                                                                                                                               |
| Independence from API keys                  | `anon` and `service_role` must be rotated simultaneously.                                                        | [Publishable and secret API keys](/docs/guides/api/api-keys) no longer are based on the JWT signing key and can be independently managed.                                              |
| Security compliance frameworks (SOC2, etc.) | Difficult to remain aligned as the secret can be extracted from Supabase.                                        | Easier alignment as the private key or shared secret can't be extracted. [Row Level Security](/docs/guides/database/postgres/row-level-security) has strong key revocation guarantees. |

## Getting started

You can start migrating away from the legacy JWT secret through the Supabase dashboard. This process does not cause downtime for your application.

1. Start off by clicking the _Migrate JWT secret_ button on the [JWT signing keys](/dashboard/project/_/settings/jwt) page. This step will import the existing legacy JWT secret into the new JWT signing keys system. Once this process completes, you will no longer be able to rotate the legacy JWT secret using the old system.
2. Simultaneously, we're creating a new asymmetric JWT signing key for you to rotate to. This key starts off as standby key -- meaning it's being advertised as a key that Supabase Auth will use in the future to create JWTs.
3. If you're not ready to switch away from the legacy JWT secret right now, you can stop here without any issue. If you wish to use a different signing key -- either to use a different signing algorithm (RSA, Elliptic Curve or shared secret) or to import a private key or shared secret you already have -- feel free to move the standby key to _Previously used_ before finally moving it to _Revoked._
4. If you do wish to start using the standby key for all new JWT use the _Rotate keys_ button. A few important notes:
   - Make sure your app does not directly rely on the legacy JWT secret. If it's verifying every JWT against the legacy JWT secret (using a library like `jose`, `jsonwebtoken` or similar), continuing with the rotation might break those components.
   - If you're using [Edge Functions](/docs/guides/functions) that have the Verify JWT setting, continuing with the rotation might break your app. You will need to turn off this setting.
   - In both cases, change or add code to your app or Edge Function that verifies the JWT. Use the `supabase.auth.getClaims()` function or read more about [Verifying a JWT from Supabase](/docs/guides/auth/jwts#verifying-a-jwt-from-supabase) on the best way to do this.
5. Rotating the keys immediately causes the Auth server to issue new JWT access tokens for signed in users signed with the new key. Non-expired access tokens will remain to be accepted, so no users will be forcefully signed out.
6. Plan for revocation of the legacy JWT secret.
   - If your access token expiry time is configured to be 1 hour, wait at least 1 hour and 15 minutes before revoking the legacy JWT secret -- now under the _Previously used_ section.
   - This prevents currently active users from being forcefully signed out.
   - In some situations, such as an active security incident you may want to revoke the legacy JWT secret immediately.

## Rotating and revoking keys

Key rotation and revocation are one of the most important processes for maintaining the security of your project and applications. The signing keys system allows you to efficiently execute these without causing downtime of your app, a deficiency present in the legacy system. Below are some common reasons when and why you should consider key rotation and revocation.

**Malicious actors abusing the legacy JWT secret, or imported private key**

- The legacy JWT secret has been leaked in logs, committed to source control, or accidentally exposed in the frontend build of your application, a library, desktop or mobile app package, etc.
- You suspect that a [member of your organization](/docs/guides/platform/access-control) has lost control of their devices, and a malicious actor may have accessed the JWT secret via the Supabase dashboard or by accessing your application's backend configuration.
- You suspect that an ex-team-member of your organization may be a malicious actor, by abusing the power the legacy JWT secret provides.
- Make sure you also switch to [publishable and secret API keys](/docs/guides/api/api-keys) and disable the `anon` and `service_role` keys.
- If you've imported a private key, and you're suspecting that this private key has been compromised on your end similarly.

**Closer alignment to security best practices and compliance frameworks (SOC2, PCI-DSS, ISO27000, HIPAA, ...)**

- It is always prudent to rotate signing keys at least once a year.
- Some security compliance frameworks strongly encourage or require frequent cryptographic key rotation.
- If you're using Supabase as part of a large enterprise, this may be required by your organization's security department.
- Creating muscle memory for the time you'll need to respond to an active security incident.

**Changing key algorithm for technical reasons**

- You may wish to switch signing algorithms due to compatibility problems or to simplify development on your end.

### Lifetime of a signing key

<div className="flex flex-row gap-6 items-center w-full">

<Image
  alt="Diagram showing the state transitions of a signing key"
  src={{
    light: '/docs/img/guides/auth-signing-keys/states.svg',
    dark: '/docs/img/guides/auth-signing-keys/states.svg',
  }}
  containerClassName="max-w-[300px] min-w-[180px]"
  width={336}
  height={766}
/>

<div>

A newly created key starts off as standby, before being rotated into in use (becoming the current key) while the existing current key becomes previously used.

At any point you can move a key from the previously used or revoked states back to being a standby key, and rotate to it. This gives you the confidence to revert back to an older key if you identify problems with the rotation, such as forgetting to update a component of your application that is relying on a specific key (for example, the legacy JWT secret).

Each action on a key is reversible (except permanent deletion).

</div>

</div>

| Action                                                                           | Accepted JWT signatures                                                | Description                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <span className="!whitespace-nowrap">Create a new key</span>                     | Current key only, new key has not created any JWTs yet.                | When you initially create a key, after choosing the signing algorithm or importing a private key you already have, it starts out in the standby state. If using an asymmetric key (RSA, Elliptic Curve) its public key will be available in the discovery endpoint. Supabase Auth does not use this key to create new JWTs. |
| <span className="!whitespace-nowrap">Rotate keys</span>                          | Both keys in the rotation.                                             | Rotation only changes the key used by Supabase Auth to create new JWTs, but the trust relationship with both keys remains.                                                                                                                                                                                                  |
| <span className="!whitespace-nowrap">Revoke key</span>                           | <span className="!whitespace-nowrap">Only from the current key.</span> | Once all regularly valid JWTs have expired (or sooner) revoke the previously used key to revoke trust in it.                                                                                                                                                                                                                |
| <span className="!whitespace-nowrap">Move to standby</span> from revoked         | Current and previously revoked key.                                    | If you've made a mistake or need more time to adjust your application, you can move a revoked key to standby. Follow up with a rotation to ensure Auth starts using the originally revoked key again to make new JWTs.                                                                                                      |
| <span className="!whitespace-nowrap">Move to standby</span> from previously used | Both keys.                                                             | This only prepares the key from the last rotation to be used by Auth to make new JWTs with it.                                                                                                                                                                                                                              |
| <span className="!whitespace-nowrap">Delete key</span>                           | -                                                                      | Permanently destroys the private key or shared secret of a key, so it will not be possible to re-use or rotate again into it.                                                                                                                                                                                               |

### Public key discovery and caching

When your signing keys use an asymmetric algorithm based on [public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography) Supabase Auth exposes the public key in the JSON Web Key Set discovery endpoint, for anyone to see. This is an important security feature allowing you to rotate and revoke keys without needing to deploy new versions of your app's backend infrastructure.

Access the currently trusted signing keys at the following endpoint:

```http
GET https://project-id.supabase.co/auth/v1/.well-known/jwks.json
```

Note that this is secure as public keys are irreversible and can only be used to verify the signature of JSON Web Tokens, but not create new ones.

This discovery endpoint is cached by Supabase's edge servers for 10 minutes. Furthermore the Supabase client libraries may cache the keys in memory for an additional 10 minutes. Your application may be using different caching behavior if you're not relying only on the Supabase client library.

This multi-level cache is a trade-off allowing fast JWT verification without placing the Auth server in the hot path of your application, increasing its reliability and performance.

Importantly Supabase products **do not rely on this cache**, so stronger security guarantees are provided especially when keys are revoked. If your application only uses [Row Level Security](/docs/guides/database/postgres/row-level-security) policies and does not have any other backend components (such as APIs, Edge Functions, servers, etc.) key rotation and revocation are instantaneous.

Finally this multi-level cache is cleared every 20 minutes, or longer if you have a custom setup. Consider the following problems that may arise due to it:

- **Urgent key revocation.** If you are in a security incident where a signing key must be urgently revoked, due to the multi-level cache your application components may still trust and authenticate JWTs signed with the revoked key. Supabase products (Auth, Data API, Storage, Realtime) **do not rely on this cache and revocation is instantaneous.** Should this be an issue for you, ensure you've built a cache busting mechanism as part of your app's backend infrastructure.
- **Quick key creation and rotation.** If you're migrating away from the legacy JWT secret or when only using the `supabase.auth.getClaims()` method this case is handled for you automatically. If you're verifying JWTs on your own, without the help of the Supabase client library, ensure that **all caches in your app** have picked up the newly created standby key before proceeding to rotation.

## Choosing the right signing algorithm

To strike the right balance between performance, security and ease-of-use, JWT signing keys are based on capabilities available in the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).

| Algorithm                                                                                                                                  | <span className="!whitespace-nowrap">JWT `alg`</span> | Information                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <span className="!whitespace-nowrap">[NIST P-256 Curve](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography)</span><br/>(Asymmetric) | <span className="!whitespace-nowrap">`ES256`</span>   | Elliptic Curves are a faster alternative than RSA, while providing comparable security. Especially important for Auth use cases is the fact that signatures using the P-256 curve are significantly shorter than those created by RSA, which reduces data transfer sizes and helps in managing cookie size. Web Crypto and most other cryptography libraries and runtimes support this curve. |
| <span className="!whitespace-nowrap">[RSA 2048](https://en.wikipedia.org/wiki/RSA_cryptosystem)</span><br/>(Asymmetric)                    | <span className="!whitespace-nowrap">`RS256`</span>   | RSA is the oldest and most widely supported public-key cryptosystem in use. While being easy to code by hand, it can be significantly slower than elliptic curves in certain aspects. We recommend using the P-256 elliptic curve instead.                                                                                                                                                    |
| <span className="!whitespace-nowrap">[Ed25519 Curve](https://en.wikipedia.org/wiki/EdDSA#Ed25519)</span><br/>(Asymmetric)                  | <span className="!whitespace-nowrap">`EdDSA`</span>   | Coming soon. This algorithm is based on a different elliptic curve cryptosystem developed in the open, unlike the P-256 curve. Web Crypto or other crypto libraries may not support it in all runtimes, making it difficult to work with.                                                                                                                                                     |
| <span className="!whitespace-nowrap">[HMAC with shared secret](https://en.wikipedia.org/wiki/HMAC)</span><br/>(Symmetric)                  | <span className="!whitespace-nowrap">`HS256`</span>   | **Not recommended for production applications.** A shared secret uses a message authentication code to verify the authenticity of a JSON Web Token. This requires that both the creator of the JWT (Auth) and the system verifying the JWT know the secret. As there is no public key counterpart, revoking this key might require deploying changes to your app's backend infrastructure.    |

<Admonition type="caution">

There is almost no benefit from using a JWT signed with a shared secret. Although it's computationally more efficient and verification is simpler to code by hand, using this approach can expose your project's data to significant security vulnerabilities or weaknesses.

Consider the following:

- Using a shared secret can make it more difficult to keep aligned with security compliance frameworks such as SOC2, PCI-DSS, ISO27000, HIPAA, etc.
- A shared secret that is in the hands of a malicious actor can be used to impersonate your users, give them access to privileged actions or data.
- It is difficult to detect or identify when or how a shared secret has been given to a malicious actor.
- Consider who might have even accidental access to the shared secret: systems, staff, devices (and their disk encryption and vulnerability patch status).
- A malicious actor can use a shared secret **far into the future**, so lacking current evidence of compromise does not mean your data is secure.
- It can be very easy to accidentally leak the shared secret in publicly available source code such as in your website or frontend, mobile app package or other executable. This is especially true if you accidentally add the secret in environment variables prefixed with `NEXT_PUBLIC_`, `VITE_`, `PUBLIC_` or other conventions by web frameworks.
- Rotating shared secrets might require careful coordination to avoid downtime of your app.

</Admonition>

## Frequently asked questions

### Why is it not possible to extract the private key or shared secret from Supabase?

You can only extract the legacy JWT secret. Once you've moved to using the JWT signing keys feature extracting of the private key or shared secret from Supabase is not possible. This ensures that no one in your organization is able to impersonate your users or gain privileged access to your project's data.

This guarantee provides your application with close alignment with security compliance frameworks (SOC2, PCI-DSS, ISO27000, HIPAA) and security best practices.

### How to create (mint) JWTs if access to the private key or shared secret is not possible?

If you wish to make your own JWTs or have access to the private key or shared secret used by Supabase, you can create a new JWT signing key by importing a private key or setting a shared secret yourself.

Use the [Supabase CLI](/docs/reference/cli/introduction) to quickly and securely generate a private key ready for import:

```sh
supabase gen signing-key --algorithm ES256
```

Make sure you store this private key in a secure location, as it will not be extractable from Supabase.

To import the generated private key to your project, create a [new standby key](/dashboard/project/_/settings/jwt) from the dashboard:

```json
{
  "kty": "EC",
  "kid": "3a18cfe2-7226-43b0-bbb4-7c5242f2406e",
  "d": "RDbwqThwtGP4WnvACvO_0nL0oMMSmMFSYMPosprlAog",
  "crv": "P-256",
  "x": "gyLVvp9dyEgylYH7nR2E2qdQ_-9Pv5i1tk7c2qZD4Nk",
  "y": "CD9RfYOTyjR5U-PC9UDlsthRpc7vAQQQ2FTt8UsX0fY"
}
```

Once imported, click **Rotate key** to activate your new signing key. Any JWT signed by your old key will continue to be usable until your old signing key is manually revoked.

To mint a new JWT using the asymmetric signing key, you need to set the following [JWT headers](/docs/guides/auth/jwts#introduction) to match your generated private key.

```json
{
  "alg": "ES256",
  "kid": "3a18cfe2-7226-43b0-bbb4-7c5242f2406e",
  "typ": "JWT"
}
```

<Admonition type="note">

The `kid` header is used to identify your public key for verification. You must use the same value when importing on platform.

</Admonition>

In addition, you need to provide the following custom claims as the JWT payload.

```json
{
  "sub": "ef0493c9-3582-425f-a362-aef909588df7",
  "role": "authenticated",
  "exp": 1757749466
}
```

- `sub` is an optional UUID that uniquely identifies a user you want to impersonate in `auth.users` table.
- `role` must be set to an existing Postgres role in your database, such as `anon`, `authenticated`, or `service_role`.
- `exp` must be set to a timestamp in the future (seconds since 1970) when this token expires. Prefer shorter-lived tokens.

For simplicity, use the following CLI command to generate tokens with the desired header and payload.

```bash
supabase gen bearer-jwt --role authenticated --sub ef0493c9-3582-425f-a362-aef909588df7
```

Finally, you can use your newly minted JWT by setting the `Authorization: Bearer <JWT>` header to all [Data API requests](/docs/guides/auth/jwts#using-custom-or-third-party-jwts).

<Admonition type="note">

A separate `apikey` header is required to access your project's APIs. This can be a [publishable, secret or the legacy `anon` or `service_role` keys](/docs/guides/api/api-keys). Using your minted JWT is not possible in this header.

</Admonition>

### Why is a 5 minute wait imposed when changing signing key states?

Changing a JWT signing key's state sets off many changes inside the Supabase platform. To ensure a consistent setup, most actions that change the state of a JWT signing key are throttled for approximately 5 minutes.

### Why is deleting the legacy JWT secret disallowed?

This is to ensure you have the ability, should you need it, to go back to the legacy JWT secret. In the future this capability will be allowed from the dashboard.

### Why does revoking the legacy JWT secret require disabling of `anon` and `service_role` API keys?

Unfortunately `anon` and `service_role` are not just API keys, but are also valid JSON Web Tokens, signed by the legacy JWT secret. Revoking the legacy JWT secret means that your application no longer trusts any JWT signed with it. Therefore before you revoke the legacy JWT secret, you must disable the `anon` and `service_role` to ensure a consistent security setup.
