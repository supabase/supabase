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
          className="mb-2 overflow-hidden transition-all border rounded bg-200 w-full"
        >
          <div
            style={{
              width: (PASSWORD_STRENGTH_PERCENTAGE as any)[passwordStrengthScore],
            }}
            className={`relative h-1 w-full ${
              (PASSWORD_STRENGTH_COLOR as any)[passwordStrengthScore]
            } transition-all duration-500 ease-out shadow-inner`}
          />
        </div>
      )}
      <p>
        {passwordStrengthMessage
          ? passwordStrengthMessage
          : 'This is the password to your Postgres database, so it must be strong and hard to guess.'}{' '}
        <span
          className="text-foreground opacity-50 underline hover:opacity-100 transition cursor-pointer"
          onClick={generateStrongPassword}
        >
          Generate a password
        </span>
      </p>
    </>
  )
}

export default PasswordStrengthBar
