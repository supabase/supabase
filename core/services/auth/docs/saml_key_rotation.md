# SAML SP Key Rotation Runbook

Zero-downtime rotation of the SAML Service Provider signing (and optional encryption) key.

---

## Overview

GoTrue advertises its SP public key inside SAML metadata. Identity Providers (IdPs) cache this
metadata and use the embedded certificate to verify SP-signed AuthnRequests and (when encryption
is enabled) to encrypt assertions sent back to the SP.

A rotation therefore has two concerns:

1. **Signing** — IdPs must trust the new certificate before GoTrue starts signing with it.
2. **Encryption** (only when `GOTRUE_SAML_ALLOW_ENCRYPTED_ASSERTIONS=true`) — GoTrue must be
   able to decrypt assertions that were encrypted with the *old* certificate while the IdP's
   cache still points to it.

Both concerns are handled automatically once you follow the steps below.

---

## Prerequisites

- Access to the GoTrue environment variables / secrets store.
- Ability to trigger a rolling restart or redeploy of GoTrue.
- `openssl` available locally (or equivalent).

---

## Step 1 — Generate the new key

```bash
# Produces a PKCS#1 DER key encoded as standard Base64 (no line breaks).
openssl genrsa 2048 | openssl rsa -outform DER | base64 | tr -d '\n'
```

Store the output somewhere safe (secret manager, vault). This is the **new key** value.

> **Requirement:** RSA 2048 or larger, public exponent 65537 (the `openssl genrsa` default).

---

## Step 2 — Announce the new certificate (dual-key window)

Set the new key as the *next* key **without** touching the primary key:

```
GOTRUE_SAML_PRIVATE_KEY=<current key — unchanged>
GOTRUE_SAML_PRIVATE_KEY_NEXT=<new key from Step 1>
```

Redeploy / restart GoTrue.

**What happens:**

- Both certificates appear in SP metadata under `<md:KeyDescriptor use="signing">`.
- The primary certificate remains first, so IdPs that already trust it continue to work.
- `Cache-Control` drops to `max-age=60` and the XML `cacheDuration` is set to `PT1H` so IdPs
  re-fetch metadata sooner.
- The `/settings` endpoint returns `"saml_private_key_next_configured": true`.
- If encrypted assertions are enabled, both certificates also appear as `use="encryption"`
  descriptors, and GoTrue will automatically retry decryption with the old key if the primary
  key fails.

**Verify:**

```bash
curl -s https://<your-domain>/auth/v1/sso/saml/metadata \
  | xmllint --xpath 'count(//md:KeyDescriptor[@use="signing"])' \
    --noout - 2>/dev/null
# Expected: 2
```

---

## Step 3 — Wait for IdP caches to drain

IdPs must re-fetch metadata and import the new certificate before you promote it. The safe
window is determined by the *largest* cache TTL among your IdPs.

**Minimum wait:** 1 hour (the `cacheDuration=PT1H` advertised in metadata).

For IdPs with longer cache windows or manual metadata import workflows, trigger a metadata
refresh in their admin console before proceeding, or contact the IdP admin to confirm the new
certificate is imported.

Confirm the new certificate is trusted by performing a test login with an affected IdP if
possible.

---

## Step 4 — Promote the new key

Swap the values and remove `_NEXT`:

```
GOTRUE_SAML_PRIVATE_KEY=<new key from Step 1>
GOTRUE_SAML_PRIVATE_KEY_NEXT=   # remove / clear
```

Redeploy / restart GoTrue.

**What happens:**

- Metadata now advertises only the new certificate.
- `Cache-Control` returns to `max-age=600`.
- Signing switches to the new key immediately.
- If encrypted assertions are enabled, GoTrue no longer attempts the fallback decryption with
  the old key (it is no longer configured).

**Verify:**

```bash
curl -s https://<your-domain>/auth/v1/sso/saml/metadata \
  | xmllint --xpath 'count(//md:KeyDescriptor[@use="signing"])' \
    --noout - 2>/dev/null
# Expected: 1

curl -s https://<your-domain>/auth/v1/settings \
  | jq '.saml_private_key_next_configured'
# Expected: false
```

Perform a test login to confirm end-to-end flow.

---

## Encrypted assertions — additional notes

When `GOTRUE_SAML_ALLOW_ENCRYPTED_ASSERTIONS=true`:

- During the dual-key window (Step 2), GoTrue accepts assertions encrypted with **either** the
  primary or the next (old) certificate. No action needed.
- The IdP may send assertions encrypted with the old certificate for up to the cache window
  after Step 4. This is safe because the old key is gone from configuration and the IdP should
  have already switched to the new certificate. If any IdP still sends assertions encrypted with
  the old certificate after promotion, those assertions will fail. Contact the IdP admin to
  force a metadata refresh.

---

## Rollback

| Phase | How to rollback |
|-------|----------------|
| After Step 2 (dual-key deployed, not yet promoted) | Clear `GOTRUE_SAML_PRIVATE_KEY_NEXT` and redeploy. No key material was changed at IdPs. |
| After Step 4 (new key promoted) | Restore the old key to `GOTRUE_SAML_PRIVATE_KEY`, set the new key in `GOTRUE_SAML_PRIVATE_KEY_NEXT`, redeploy. You are back to the dual-key window. Wait for IdPs to re-import the old certificate before relying on it. |

> Avoid skipping the dual-key window. Promoting a new key before IdPs have cached the new
> certificate will break SP-initiated flows for the cache window duration.

---

## Quick reference

| Variable | Purpose |
|----------|---------|
| `GOTRUE_SAML_PRIVATE_KEY` | Active signing (and decryption) key. PKCS#1 DER, Base64-encoded. |
| `GOTRUE_SAML_PRIVATE_KEY_NEXT` | Incoming key during rotation. Advertised in metadata; used as decryption fallback. Clear after promotion. |
| `GOTRUE_SAML_ALLOW_ENCRYPTED_ASSERTIONS` | Enable encrypted assertion support. Both keys appear as `use="encryption"` descriptors when rotation is active. |
