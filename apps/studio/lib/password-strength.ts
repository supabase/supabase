import { DEFAULT_MINIMUM_PASSWORD_STRENGTH, PASSWORD_STRENGTH } from '@/lib/constants'

// This is the same as the ZXCVBNScore type from zxcvbn
// but we need to define it here because we don't to import zxcvbn everywhere
export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4

/**
 * True when the password contains characters that must be percent-encoded
 * before the password can be used in a connection string URL.
 */
export function passwordNeedsPercentEncoding(password: string) {
  try {
    return password !== encodeURIComponent(password)
  } catch {
    // encodeURIComponent throws on lone surrogates
    return true
  }
}

/**
 * True when the password contains non-ASCII or non-printable characters.
 * Database passwords must only contain standard printable ASCII characters.
 */
export function passwordHasUnsupportedCharacters(password: string) {
  return /[^\x20-\x7E]/.test(password)
}

export async function passwordStrength(value: string) {
  // [Alaister]: Lazy load zxcvbn to avoid bundling it with the main app (it's pretty chunky)
  const zxcvbn = await import('zxcvbn').then((module) => module.default)

  let message: string = ''
  let warning: string = ''
  let strength: PasswordStrengthScore = 0

  if (value && value !== '') {
    const errors: string[] = []
    const warnings: string[] = []

    if (value.length > 99) {
      errors.push('Maximum length of password exceeded')
      warnings.push('Password should be less than 100 characters')
    }

    if (passwordHasUnsupportedCharacters(value)) {
      errors.push('Contains unsupported characters')
      warnings.push('Password should only contain letters, numbers, and standard symbols')
    }

    if (errors.length > 0) {
      message = `${PASSWORD_STRENGTH[0]} ${errors.join('. ')}`
      warning = warnings.join('. ')
    } else {
      const result = zxcvbn(value)
      const resultScore = result?.score ?? 0

      const score = (PASSWORD_STRENGTH as any)[resultScore]
      const suggestions = result.feedback?.suggestions?.join(' ') ?? ''

      message = `${score} ${suggestions}`
      strength = resultScore

      if (resultScore < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
        warning = `${
          result?.feedback?.warning ? result.feedback.warning + '.' : ''
        } You need a stronger password.`
      }
    }
  }

  return {
    message,
    warning,
    strength,
  }
}
