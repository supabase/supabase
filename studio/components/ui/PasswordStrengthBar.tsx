import {
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  PASSWORD_STRENGTH_COLOR,
  PASSWORD_STRENGTH_PERCENTAGE,
} from 'lib/constants'

interface Props {
  passwordStrengthScore: number
  passwordStrengthMessage: string
  password: string
  generateStrongPassword: () => void
}

const PasswordStrengthBar = ({
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
          aria-valuenow={(PASSWORD_STRENGTH_PERCENTAGE as any)[passwordStrengthScore]}
          aria-valuetext={(PASSWORD_STRENGTH_PERCENTAGE as any)[passwordStrengthScore]}
          role="progressbar"
          className="mb-2 overflow-hidden transition-all border rounded bg-bg-alt-light dark:bg-bg-alt-dark dark:border-dark"
        >
          <div
            style={{
              width: (PASSWORD_STRENGTH_PERCENTAGE as any)[passwordStrengthScore],
            }}
            className={`relative h-2 w-full ${
              (PASSWORD_STRENGTH_COLOR as any)[passwordStrengthScore]
            } transition-all duration-500 ease-out shadow-inner`}
          ></div>
        </div>
      )}
      <p>
        {passwordStrengthMessage
          ? passwordStrengthMessage
          : 'This is the password to your postgres database, so it must be a strong password and hard to guess.'}{' '}
        <span
          className="text-brand-800 underline hover:text-brand-900 transition cursor-pointer"
          onClick={generateStrongPassword}
        >
          Generate a password
        </span>
      </p>
    </>
  )
}

export default PasswordStrengthBar
