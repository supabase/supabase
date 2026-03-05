'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import {
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
} from 'ui'
import { LeaderboardContent } from './LeaderboardContent'
import { LEADERBOARD_PERIODS } from '~/data/contribute'
import { use } from 'react'

export function LeaderboardClient({
  initialLeaderboardPromise,
  initialPeriod,
}: {
  initialLeaderboardPromise: Promise<import('~/types/contribute').LeaderboardRow[]>
  initialPeriod: (typeof LEADERBOARD_PERIODS)[number]
}) {
  const [period, setPeriod] = useQueryState(
    'period',
    parseAsString.withDefault('all').withOptions({
      shallow: false,
    })
  )

  const validPeriod = LEADERBOARD_PERIODS.includes(period as (typeof LEADERBOARD_PERIODS)[number])
    ? (period as (typeof LEADERBOARD_PERIODS)[number])
    : 'all'

  const periodLabels: Record<(typeof LEADERBOARD_PERIODS)[number], string> = {
    all: 'All time',
    year: 'This year',
    quarter: 'This quarter',
    month: 'This month',
    week: 'This week',
    today: 'Today',
  }

  // Use the initial promise if period hasn't changed, otherwise it will refetch via navigation
  const leaderboard = use(initialLeaderboardPromise)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16">
      {/* Back Link */}
      <Link
        href="/contribute"
        className="inline-flex items-center gap-2 text-foreground-lighter hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contribute
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Top Community Contributors</h1>
        <Link
          href="/contribute/leaderboard/how-it-works"
          className="text-sm text-foreground-lighter hover:text-foreground transition-colors"
        >
          How does this work?
        </Link>
      </div>

      {/* Period Selector */}
      <div className="mb-8">
        <Select value={validPeriod} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>{periodLabels[validPeriod]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LEADERBOARD_PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {periodLabels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leaderboard Content */}
      <LeaderboardContent leaderboard={leaderboard} />
    </div>
  )
}
