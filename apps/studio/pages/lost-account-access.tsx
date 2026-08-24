import { LostAccountAccessFormWizard } from '@/components/interfaces/SignIn/LostAccountAccessForm'
import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import type { NextPageWithLayout } from '@/types'

const LostAccountAccess: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col gap-4">
      <LostAccountAccessFormWizard />
    </div>
  )
}

LostAccountAccess.getLayout = (page) => (
  <ForgotPasswordLayout heading="Recover your account">{page}</ForgotPasswordLayout>
)

export default LostAccountAccess
