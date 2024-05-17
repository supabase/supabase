import { Meta } from '@storybook/react'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from 'ui'

const meta: Meta = {
  title: 'shadcn/InputOTP',
  component: InputOTP,
}

export function Default() {
  return (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}

export default meta
