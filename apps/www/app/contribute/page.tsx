import { Hero } from '~/components/Contribute/Hero'
import { UnansweredThreads } from '~/components/Contribute/UnansweredThreads'
import DefaultLayout from '~/components/Layouts/Default'
import { ContributeGuard } from './ContributeGuard'

// eslint-disable-next-line no-restricted-exports
export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<{
    product_area?: string | string[]
    channel?: string
    stack?: string | string[]
    search?: string
  }>
}) {
  const { product_area, channel, stack, search } = await searchParams

  return (
    <ContributeGuard>
      <DefaultLayout>
        <main className="min-h-screen flex flex-col items-center">
          <div className="flex-1 w-full flex flex-col gap-20 items-center">
            <div className="flex-1 flex flex-col gap-6 w-full">
              <div className="max-w-5xl mx-auto px-5 w-full">
                <Hero />
              </div>
              <UnansweredThreads
                product_area={product_area}
                channel={channel}
                stack={stack}
                search={search}
              />
            </div>
          </div>
        </main>
      </DefaultLayout>
    </ContributeGuard>
  )
}
