import { getUnansweredThreads } from '~/data/contribute'
import { UnansweredThreadsTable } from './UnansweredThreadsTable'

export interface Thread {
  id: string
  title: string
  user: string
  channel: string
  tags: string[]
  product_areas: string[]
  posted: string
  source: 'discord' | 'reddit' | 'github'
  external_activity_url: string
  category: string | null
  sub_category: string | null
  summary: string | null
}

export async function UnansweredThreads({ product_area }: { product_area?: string }) {
  try {
    const threads = await getUnansweredThreads(product_area)
    return <UnansweredThreadsTable threads={threads} />
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return (
      <section className="w-full max-w-7xl mx-auto px-4 py-16">
        <div className="border border-border rounded-lg p-8 text-center">
          <p className="text-destructive">Error loading threads: {errorMessage}</p>
        </div>
      </section>
    )
  }
}
