export type PasswordConditionsHelperProps = {
  password: string
}

const PasswordConditionsHelper = ({ password }: PasswordConditionsHelperProps) => {
  const isEightCharactersLong = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};`':"\\|,.<>\/?]/.test(password)

  return (
    <div className="text-sm">
      <PasswordCondition title="Uppercase letter" isMet={hasUppercase} />
      <PasswordCondition title="Lowercase letter" isMet={hasLowercase} />
      <PasswordCondition title="Number" isMet={hasNumber} />
      <PasswordCondition title="Special character (e.g. !?<>@#$%)" isMet={hasSpecialCharacter} />
      <PasswordCondition title="> 7 characters" isMet={isEightCharactersLong} />
    </div>
  )
}

export default PasswordConditionsHelper

type PasswordConditionProps = {
  title: string
  isMet: boolean
}

const PasswordCondition = ({ title, isMet }: PasswordConditionProps) => {
  return (
    <div
      className={
        'flex items-center gap-1 space-x-1.5 transition duration-200 ' +
        (isMet ? 'text-foreground-light' : 'text-foreground-lighter')
      }
    >
      {isMet ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          stroke-width={1.5}
          viewBox="0 0 24 24"
          className="w-4 h-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
          />
        </svg>
      )}

      <p className="text-sm">{title}</p>
    </div>
  )
}
