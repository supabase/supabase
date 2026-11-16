import { DEFAULT_MINIMUM_PASSWORD_STRENGTH, PASSWORD_STRENGTH } from '@/lib/constants'

// This is the same as the ZXCVBNScore type from zxcvbn
// but we need to define it here because we don't to import zxcvbn everywhere
export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4

/** Placeholder text shown in database password inputs. */
export const DATABASE_PASSWORD_PLACEHOLDER = 'Type in a strong password'

export const PLACEHOLDER_PASSWORD_WARNING =
  'Nice try, but that is the placeholder text. Maybe try a different password?'

/**
 * True when the password is the input's placeholder text, ignoring case and
 * surrounding whitespace.
 */
export function isPlaceholderPassword(password: string) {
  return password.trim().toLowerCase() === DATABASE_PASSWORD_PLACEHOLDER.toLowerCase()
}

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

export async function passwordStrength(value: string) {
  // [Alaister]: Lazy load zxcvbn to avoid bundling it with the main app (it's pretty chunky)
  const zxcvbn = await import('zxcvbn').then((module) => module.default)

  let message: string = ''
  let warning: string = ''
  let strength: PasswordStrengthScore = 0

  if (value && value !== '') {
    if (isPlaceholderPassword(value)) {
      message = PASSWORD_STRENGTH[0]
      warning = PLACEHOLDER_PASSWORD_WARNING
    } else if (value.length > 99) {
      message = `${PASSWORD_STRENGTH[0]} Maximum length of password exceeded`
      warning = `Password should be less than 100 characters`
    } else {
      const result = zxcvbn(value)
      const resultScore = result?.score ?? 0

      const score = (PASSWORD_STRENGTH as any)[resultScore]
      const suggestions = result.feedback?.suggestions?.join(' ') ?? ''

      message = `${score} ${suggestions}`
      strength = resultScore

      // warning message for anything below 4 strength :string
      if (resultScore < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
        warning = `${
          result?.feedback?.warning ? result?.feedback?.warning + '.' : ''
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
