import {
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  PASSWORD_STRENGTH_COLOR,
  PASSWORD_STRENGTH_PERCENTAGE,
} from 'lib/constants'
import { Typography } from '@supabase/ui'

interface Props {
  passwordStrengthScore: number
  passwordStrengthMessage: string
  password: string
}

const PasswordStrengthBar = ({
  passwordStrengthScore = 0,
  passwordStrengthMessage = '',
  password = '',
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
          className="mb-2 bg-bg-alt-light dark:bg-bg-alt-dark rounded overflow-hidden transition-all border dark:border-dark"
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
      <Typography.Text
        className={
          passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH ? 'text-green-600' : ''
        }
      >
        {passwordStrengthMessage
          ? passwordStrengthMessage
          : 'This is the password to your postgres database, so it must be a strong password and hard to guess.'}
      </Typography.Text>
    </>
  )
}

export default PasswordStrengthBar
