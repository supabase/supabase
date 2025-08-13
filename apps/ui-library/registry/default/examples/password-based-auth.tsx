import { SignUpForm } from '@/registry/default/blocks/password-based-auth-nextjs/components/sign-up-form'

const PasswordBasedAuthDemo = () => {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  )
}

export default PasswordBasedAuthDemo
