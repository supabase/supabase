import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import DefaultLayout from '~/components/Layouts/Default'
import { ThreadContent } from '~/components/Contribute/ThreadContent'
import PageLoading from './page-loading'
import type { Metadata } from 'next'
import { ContributeGuard } from '../../ContributeGuard'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
}

// eslint-disable-next-line no-restricted-exports
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <ContributeGuard>
      <DefaultLayout>
        <main className="min-h-screen flex flex-col items-center">
          <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-16">
            <Link
              href="/contribute"
              className="inline-flex items-center gap-2 text-foreground-lighter hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to threads
            </Link>

            <Suspense fallback={<PageLoading />}>
              <ThreadContent id={id} />
            </Suspense>
          </div>
        </main>
      </DefaultLayout>
    </ContributeGuard>
  )
}
