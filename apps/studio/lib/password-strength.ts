import { post } from 'lib/common/fetch'
import { API_URL, DEFAULT_MINIMUM_PASSWORD_STRENGTH, PASSWORD_STRENGTH } from 'lib/constants'
import { toast } from 'sonner'

export default async function passwordStrength(value: string) {
  let message: string = ''
  let warning: string = ''
  let strength: number = 0

  if (value && value !== '') {
    if (value.length > 99) {
      message = `${PASSWORD_STRENGTH[0]} Maximum length of password exceeded`
      warning = `Password should be less than 100 characters`
    } else {
      // [Joshen] Unable to use RQ atm due to our Jest tests being in JS
      const response = await post(`${API_URL}/profile/password-check`, { password: value })
      if (!response.error) {
        const { result } = response
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
        toast.error(`Failed to check password strength: ${response.error.message}`)
      }
    }
  }

  return {
    message,
    warning,
    strength,
  }
}
