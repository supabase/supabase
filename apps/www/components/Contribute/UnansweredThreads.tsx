import {
  getAllProductAreas,
  getAllStacks,
  getChannelCounts,
  getUnansweredThreads,
} from '~/data/contribute'
import { UnansweredThreadsTable } from './UnansweredThreadsTable'

export async function UnansweredThreads({
  product_area,
  channel,
  stack,
  search,
}: {
  product_area?: string
  channel?: string
  stack?: string
  search?: string
}) {
  try {
    const [threads, channelCounts, allProductAreas, allStacks] = await Promise.all([
      getUnansweredThreads(product_area, channel, stack, search),
      getChannelCounts(product_area, stack, search),
      getAllProductAreas(),
      getAllStacks(),
    ])

    return (
      <UnansweredThreadsTable
        threads={threads}
        channelCounts={channelCounts}
        allProductAreas={allProductAreas}
        allStacks={allStacks}
      />
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return (
      <section className="w-full max-w-7xl mx-auto px-4">
        <div className="border border-border rounded-lg p-8 text-center">
          <p className="text-destructive">Error loading threads: {errorMessage}</p>
        </div>
      </section>
    )
  }
}
