import { createFileRoute } from '@tanstack/react-router'
import { cn } from 'ui'

import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import SignInPartnerPage from '@/pages/sign-in-partner'

export const Route = createFileRoute('/_auth/sign-in-partner')({
  component: SignInPartner,
})

function SignInPartner() {
  return (
    // [Joshen] Just using this layout for the styling
    <ForgotPasswordLayout
      showHeadings={false}
      className={cn(
        'mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 !gap-y-0',
        '[&>div:first-child]:absolute [&>div:first-child]:!px-0',
        '[&>div:last-child]:flex-grow [&>div:last-child>main]:!px-0'
      )}
    >
      <SignInPartnerPage dehydratedState={undefined} />
    </ForgotPasswordLayout>
  )
}
