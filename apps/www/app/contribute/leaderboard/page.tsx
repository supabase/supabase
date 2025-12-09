import { Suspense } from 'react'
import DefaultLayout from '~/components/Layouts/Default'
import { LeaderboardClient } from '~/components/Contribute/Leaderboard'
import { getLeaderboard, LEADERBOARD_PERIODS } from '~/data/contribute'

function LeaderboardLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16">
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        Loading leaderboard...
      </div>
    </div>
  )
}

// eslint-disable-next-line no-restricted-exports
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  // turn this page off for now
  return
  const params = await searchParams
  const periodParam = params.period
  const validPeriod = LEADERBOARD_PERIODS.includes(
    periodParam as (typeof LEADERBOARD_PERIODS)[number]
  )
    ? (periodParam as (typeof LEADERBOARD_PERIODS)[number])
    : 'all'

  const leaderboardPromise = getLeaderboard(validPeriod)

  return (
    <DefaultLayout>
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <div className="flex-1 flex flex-col gap-8 w-full">
            <Suspense fallback={<LeaderboardLoading />}>
              <LeaderboardClient
                initialLeaderboardPromise={leaderboardPromise}
                initialPeriod={validPeriod}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </DefaultLayout>
  )
}
