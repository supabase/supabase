import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ContributePageLayout } from '~/components/Contribute/ContributePageLayout'
import { Conversation } from '~/components/Contribute/Conversation'
import { getThreadById } from '~/data/contribute'
import type { Metadata } from 'next'
import PageLoading from './page-loading'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const thread = await getThreadById(id)

  if (!thread) {
    notFound()
  }

  return (
    <ContributePageLayout>
      <Suspense fallback={<PageLoading />}>
        <div className="grid gap-6">
          <Conversation thread={thread} />
        </div>
      </Suspense>
    </ContributePageLayout>
  )
}
