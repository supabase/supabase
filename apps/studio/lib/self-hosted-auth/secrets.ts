export const SECRET_FIELDS = [
  'smtp_pass',
  'external_google_secret',
  'external_github_secret',
  'external_azure_secret',
  'external_facebook_secret',
  'twilio_auth_token',
  'hook_custom_access_token_secrets',
]

/**
 * Masks secrets from the raw config object.
 * Replaces actual secret values with null, and adds a `_configured` boolean flag.
 */
export function maskSecrets(config: Record<string, any>): Record<string, any> {
  const masked = { ...config }
  for (const field of SECRET_FIELDS) {
    if (field in masked) {
      const hasValue = typeof masked[field] === 'string' && masked[field].length > 0
      masked[`${field}_configured`] = hasValue
      masked[field] = null
    } else {
      masked[`${field}_configured`] = false
    }
  }
  return masked
}

/**
 * Filters out un-updated secrets from a PATCH payload.
 *
 * Rules:
 * 1. If a secret field is omitted, it remains unchanged.
 * 2. If it's empty/null but the `clear_X` flag is NOT true, it remains unchanged.
 * 3. If it has a string value, it is updated.
 * 4. If `clear_X` is true, the field is cleared.
 */
export function processSecretUpdates(
  payload: Record<string, any>,
  currentConfig: Record<string, any>
): Record<string, any> {
  const updates = { ...payload }

  for (const field of SECRET_FIELDS) {
    const clearFlag = `clear_${field}`
    const shouldClear = updates[clearFlag] === true

    if (shouldClear) {
      updates[field] = ''
    } else if (field in updates) {
      // If present in payload but empty/null and not explicitly cleared, remove it from updates
      if (!updates[field]) {
        delete updates[field]
      }
    }

    // Always remove the clear flag so it doesn't get persisted
    delete updates[clearFlag]
  }

  return updates
}
