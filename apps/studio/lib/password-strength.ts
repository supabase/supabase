import { post as post_ } from 'data/fetchers'
import { DEFAULT_MINIMUM_PASSWORD_STRENGTH, PASSWORD_STRENGTH } from 'lib/constants'
import { toast } from 'sonner'
import { ResponseError } from 'types'

export default async function passwordStrength(value: string) {
  let message: string = ''
  let warning: string = ''
  let strength: number = 0

  if (value && value !== '') {
    if (value.length > 99) {
      message = `${PASSWORD_STRENGTH[0]} Maximum length of password exceeded`
      warning = `Password should be less than 100 characters`
    } else {
      const { data, error } = await post_('/platform/profile/password-check', {
        body: { password: value },
      })
      if (!error) {
        const { result } = data
        const resultScore = result?.score ?? 0

        const score = (PASSWORD_STRENGTH as any)[resultScore]
        const suggestions = result.feedback?.suggestions
          ? result.feedback.suggestions.join(' ')
          : ''

        message = `${score} ${suggestions}`
        strength = resultScore

        // warning message for anything below 4 strength :string
        if (resultScore < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
          warning = `${
            result?.feedback?.warning ? result?.feedback?.warning + '.' : ''
          } You need a stronger password.`
        }
      } else {
        toast.error(`Failed to check password strength: ${(error as ResponseError).message}`)
      }
    }
  }

  return {
    message,
    warning,
    strength,
  }
}
