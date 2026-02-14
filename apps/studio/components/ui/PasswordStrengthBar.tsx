import { PASSWORD_STRENGTH_COLOR, PASSWORD_STRENGTH_PERCENTAGE } from 'lib/constants'
import { PasswordStrengthScore } from 'lib/password-strength'
import { InlineLinkClassName } from './InlineLink'

interface Props {
  passwordStrengthScore: PasswordStrengthScore
  passwordStrengthMessage: string
  password: string
  generateStrongPassword: () => void
}

export const PasswordStrengthBar = ({
  passwordStrengthScore = 0,
  passwordStrengthMessage = '',
  password = '',
  generateStrongPassword,
}: Props) => {
  return (
    <>
      {password && (
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={PASSWORD_STRENGTH_PERCENTAGE[passwordStrengthScore]}
          aria-valuetext={`${PASSWORD_STRENGTH_PERCENTAGE[passwordStrengthScore]}%`}
          role="progressbar"
          className="mb-2 overflow-hidden transition-all border rounded bg-200 w-full"
        >
          <div
            style={{
              width: `${PASSWORD_STRENGTH_PERCENTAGE[passwordStrengthScore]}%`,
            }}
            className={`relative h-1 w-full ${PASSWORD_STRENGTH_COLOR[passwordStrengthScore]} transition-all duration-500 ease-out shadow-inner`}
          />
        </div>
      )}
      <p>
        {(passwordStrengthMessage
          ? passwordStrengthMessage
          : 'This is the password to your Postgres database, so it must be strong and hard to guess.') +
          ' '}
        <button type="button" className={InlineLinkClassName} onClick={generateStrongPassword}>
          Generate a password
        </button>
        .
      </p>
    </>
  )
}
