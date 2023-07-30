import { PASSWORD_STRENGTH_COLOR, PASSWORD_STRENGTH_PERCENTAGE } from 'lib/constants'

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
          className="mb-2 overflow-hidden transition-all border rounded bg-scale-200 dark:bg-scale-200 dark:border-dark"
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
          : 'This is the password to your postgres database, so it must be strong and hard to guess.'}{' '}
        <span
          className="text-brand-800 underline hover:text-brand transition cursor-pointer"
          onClick={generateStrongPassword}
        >
          Generate a password
        </span>
      </p>
    </>
  )
}

export default PasswordStrengthBar
