import { RecoverAccountWizard } from '@/components/interfaces/SignIn/RecoverAccountWizard'
import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import type { NextPageWithLayout } from '@/types'

const RecoverAccountAccess: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col gap-4">
      <RecoverAccountWizard />
    </div>
  )
}

RecoverAccountAccess.getLayout = (page) => (
  <ForgotPasswordLayout heading="Recover your account">{page}</ForgotPasswordLayout>
)

export default RecoverAccountAccess
