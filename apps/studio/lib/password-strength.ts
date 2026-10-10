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
 * Characters that Postgres rewrites via SASLprep (RFC 4013) when it derives the SCRAM
 * verifier: the "commonly mapped to nothing" set of RFC 3454 table B.1, plus the
 * non-ASCII spaces of table C.1.2 that it folds into a plain space.
 */
const SASLPREP_REWRITTEN_CHARACTERS =
  /[\u00A0\u00AD\u034F\u1680\u1806\u180B-\u180D\u2000-\u200D\u202F\u205F\u2060\u3000\uFE00-\uFE0F\uFEFF]/

/**
 * True when Postgres would store a SCRAM verifier for a different string than the one
 * typed. libpq applies SASLprep before it authenticates, node-postgres sends the raw
 * string, so such a password is accepted on save and then fails every dashboard query.
 */
export function passwordHasUnsupportedCharacters(password: string) {
  return SASLPREP_REWRITTEN_CHARACTERS.test(password) || password.normalize('NFKC') !== password
}

/**
 * Scores a database password and returns the copy shown under the input. Returns a
 * strength of 0 with a warning for passwords that are too long, or that contain
 * characters Postgres cannot authenticate with, before falling back to zxcvbn.
 */
export async function passwordStrength(value: string) {
  // [Alaister]: Lazy load zxcvbn to avoid bundling it with the main app (it's pretty chunky)
  const zxcvbn = await import('zxcvbn').then((module) => module.default)

  let message: string = ''
  let warning: string = ''
  let strength: PasswordStrengthScore = 0

  if (value && value !== '') {
    if (value.length > 99) {
      message = `${PASSWORD_STRENGTH[0]} Maximum length of password exceeded`
      warning = `Password should be less than 100 characters`
    } else if (passwordHasUnsupportedCharacters(value)) {
      message = `${PASSWORD_STRENGTH[0]} Contains characters Postgres cannot authenticate with`
      warning = `Use only letters, numbers, and standard symbols, or generate a new password.`
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
