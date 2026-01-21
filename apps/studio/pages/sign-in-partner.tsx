import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { SignInPartner } from 'components/interfaces/SignIn/SignInPartner'
import ForgotPasswordLayout from 'components/layouts/SignInLayout/ForgotPasswordLayout'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { cn } from 'ui'

const SignInPartnerPage: NextPageWithLayout = () => {
  const router = useRouter()

  useEffect(() => {
    // Partner sign-in is platform-only feature
    if (!IS_PLATFORM) {
      router.replace('/project/default')
    }
  }, [router])

  return <SignInPartner />
}

SignInPartnerPage.getLayout = (page) => (
  // [Joshen] Just using this layout for the styling
  <ForgotPasswordLayout
    showHeadings={false}
    className={cn(
      'mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 !gap-y-0',
      '[&>div:first-child]:absolute [&>div:first-child]:!px-0',
      '[&>div:last-child]:flex-grow [&>div:last-child>main]:!px-0'
    )}
  >
    {page}
  </ForgotPasswordLayout>
)

export default SignInPartnerPage
