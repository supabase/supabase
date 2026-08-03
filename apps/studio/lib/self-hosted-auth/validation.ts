export function validateUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must use http or https protocol'
    }
    return null
  } catch (e) {
    return 'Invalid URL format'
  }
}

export function validateHookUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:', 'pg-functions:'].includes(parsed.protocol)) {
      return 'Hook URI must use http, https, or pg-functions protocol'
    }
    return null
  } catch (e) {
    return 'Invalid URL format'
  }
}

export function validateRedirectList(urls: string | undefined): string | null {
  if (!urls) return null
  const urlList = urls.split(',').map((u) => u.trim())
  for (const url of urlList) {
    if (!url) continue
    // Allow wildcards in redirect lists, which makes strict URL parsing fail
    if (url.includes('*')) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'Redirect URLs must start with http:// or https://'
      }
    } else {
      const error = validateUrl(url)
      if (error) return `Invalid redirect URL (${url}): ${error}`
    }
  }
  return null
}

export function validateSmtpPort(port: string | undefined): string | null {
  if (!port) return null
  if (!/^\d+$/.test(port)) {
    return 'SMTP Port must be a valid number'
  }
  const num = parseInt(port, 10)
  if (isNaN(num) || num <= 0 || num > 65535) {
    return 'SMTP Port must be a valid port number between 1 and 65535'
  }
  return null
}

export function validateConfigUpdate(payload: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {}

  if (payload.site_url) {
    const err = validateUrl(payload.site_url)
    if (err) errors.site_url = err
  }

  if (payload.uri_allow_list) {
    const err = validateRedirectList(payload.uri_allow_list)
    if (err) errors.uri_allow_list = err
  }

  if (payload.smtp_port) {
    const err = validateSmtpPort(payload.smtp_port)
    if (err) errors.smtp_port = err
  }

  if (payload.hook_custom_access_token_uri) {
    const err = validateHookUrl(payload.hook_custom_access_token_uri)
    if (err) errors.hook_custom_access_token_uri = err
  }

  if (payload.hook_mfa_verification_attempt_uri) {
    const err = validateHookUrl(payload.hook_mfa_verification_attempt_uri)
    if (err) errors.hook_mfa_verification_attempt_uri = err
  }

  if (payload.hook_password_verification_attempt_uri) {
    const err = validateHookUrl(payload.hook_password_verification_attempt_uri)
    if (err) errors.hook_password_verification_attempt_uri = err
  }

  return errors
}
