import { Admonition } from 'ui-patterns'
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
  product_area?: string | string[]
  channel?: string
  stack?: string | string[]
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
      <Admonition
        type="destructive"
        title="Error loading threads"
        description={errorMessage}
        className="max-w-md mx-auto"
      />
    )
  }
}
