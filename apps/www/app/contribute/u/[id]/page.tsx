import { Suspense } from 'react'
import { ContributePageLayout } from '~/components/Contribute/ContributePageLayout'
import { UserProfile } from '~/components/Contribute/UserProfile'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
}

function UserProfileLoading() {
  return (
    <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-surface-200">
      Loading user profile...
    </div>
  )
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const username = decodeURIComponent(id)

  return (
    <ContributePageLayout>
      <Suspense fallback={<UserProfileLoading />}>
        <UserProfile username={username} />
      </Suspense>
    </ContributePageLayout>
  )
}
