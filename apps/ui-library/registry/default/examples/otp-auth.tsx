import { OTPRequestForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/otp-request-form'

const OTPAuthDemo = () => {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <OTPRequestForm />
      </div>
    </div>
  )
}

export default OTPAuthDemo
