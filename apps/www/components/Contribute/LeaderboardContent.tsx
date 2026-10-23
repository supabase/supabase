'use client'

import { cn } from 'ui'
import type { LeaderboardRow } from '~/types/contribute'

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getAvatarColor(name: string | null): string {
  if (!name) return 'bg-surface-300'
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-indigo-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function Avatar({ name, size = 'md' }: { name: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const initials = getInitials(name)
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-2xl',
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold',
        getAvatarColor(name),
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  )
}

function TopThreeCard({
  rank,
  name,
  score,
  isFirst,
}: {
  rank: number
  name: string | null
  score: number
  isFirst: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center p-6 rounded-lg border border-border bg-surface-200',
        isFirst && 'scale-105'
      )}
    >
      <div className="mb-4">
        <Avatar name={name} size="lg" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-1">{name || 'Anonymous'}</h3>
        <div className="text-3xl font-bold text-foreground">{score.toLocaleString()}</div>
        <div className="text-sm text-foreground-lighter mt-1">Replies</div>
      </div>
    </div>
  )
}

function LeaderboardRowItem({
  rank,
  name,
  score,
}: {
  rank: number
  name: string | null
  score: number
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className="text-lg font-semibold text-foreground w-12">{rank}</div>
      <Avatar name={name} size="sm" />
      <div className="flex-1">
        <div className="text-foreground font-medium">{name || 'Anonymous'}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold text-foreground">{score.toLocaleString()}</div>
        <div className="text-xs text-foreground-lighter">Replies</div>
      </div>
    </div>
  )
}

export function LeaderboardContent({ leaderboard }: { leaderboard: LeaderboardRow[] }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        No leaderboard data available
      </div>
    )
  }

  const topThree = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="w-full">
      {/* Top 3 Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {topThree.length >= 2 && (
            <TopThreeCard
              rank={2}
              name={topThree[1]?.author ?? null}
              score={topThree[1]?.reply_count ?? 0}
              isFirst={false}
            />
          )}
          {topThree.length >= 1 && (
            <TopThreeCard
              rank={1}
              name={topThree[0]?.author ?? null}
              score={topThree[0]?.reply_count ?? 0}
              isFirst={true}
            />
          )}
          {topThree.length >= 3 && (
            <TopThreeCard
              rank={3}
              name={topThree[2]?.author ?? null}
              score={topThree[2]?.reply_count ?? 0}
              isFirst={false}
            />
          )}
        </div>
      )}

      {/* Rest of the leaderboard */}
      {rest.length > 0 && (
        <div className="border border-border rounded-lg bg-surface-200 p-6">
          {rest.map((entry, index) => (
            <LeaderboardRowItem
              key={entry.author || index}
              rank={index + 4}
              name={entry.author}
              score={entry.reply_count}
            />
          ))}
        </div>
      )}
    </div>
  )
}
