import { PasswordlessLoginForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/passwordless-login-form'

const PasswordlessAuthDemo = () => {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <PasswordlessLoginForm />
      </div>
    </div>
  )
}

export default PasswordlessAuthDemo
