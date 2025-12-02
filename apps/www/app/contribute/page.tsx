import { GetStarted } from '~/components/Contribute/GetStarted'
import { Hero } from '~/components/Contribute/Hero'
import { UnansweredThreads } from '~/components/Contribute/UnansweredThreads'
import DefaultLayout from '~/components/Layouts/Default'

export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<{ product_area?: string }>
}) {
  const params = await searchParams
  const product_area = params.product_area

  return (
    <DefaultLayout>
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <div className="flex-1 flex flex-col gap-8 w-full">
            <div className="max-w-5xl mx-auto px-5 w-full">
              <Hero />
              <GetStarted />
            </div>
            <UnansweredThreads product_area={product_area} />
          </div>
        </div>
      </main>
    </DefaultLayout>
  )
}
