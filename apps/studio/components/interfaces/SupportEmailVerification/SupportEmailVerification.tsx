import { useParams } from 'common'
import { useEffect } from 'react'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { useVerifyEmailMutation } from '@/data/support/support-email-verification-mutation'

export const SupportEmailVerification = () => {
  const { token } = useParams()

  const {
    mutate: verifyEmail,
    isPending,
    isSuccess,
    isError,
    error,
  } = useVerifyEmailMutation({ onError: () => {} })

  useEffect(() => {
    if (token) {
      verifyEmail({ token })
    }
  }, [token, verifyEmail])

  const isExpiredOrUsed = isError && error?.code === 410

  const withLayout = (title: string, children: React.ReactNode) => (
    <InterstitialLayout logo={<SupabaseLogo />} title={title}>
      <div className="px-6 pb-6">{children}</div>
    </InterstitialLayout>
  )

  if (!token) {
    return withLayout(
      'Email Verification',
      <Admonition
        type="warning"
        description="No verification token was found. Please use the link from your email."
      />
    )
  }

  if (isPending) {
    return withLayout(
      'Verifying your email…',
      <div className="flex flex-col gap-3">
        <ShimmeringLoader className="h-4 w-full py-0" />
        <ShimmeringLoader className="h-4 w-3/4 py-0" />
      </div>
    )
  }

  if (isSuccess) {
    return withLayout(
      'Account linked',
      <Admonition
        type="success"
        description="Thanks for verifying, our team now has the context they need to resolve your issue more efficiently. You can close this page."
      />
    )
  }

  if (isExpiredOrUsed) {
    return withLayout(
      'Link no longer valid',
      <Admonition
        type="warning"
        description="This verification link has already been used or has expired. You can close this page."
      />
    )
  }

  return withLayout(
    'Verification failed',
    <Admonition
      type="destructive"
      description="We weren't able to verify your identity this time. Our team will still be in touch, verification just helps us view your organization and project details to resolve your issue more efficiently. You can close this page."
    />
  )
}
