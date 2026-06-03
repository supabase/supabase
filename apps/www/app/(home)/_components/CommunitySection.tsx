'use client'

import Link from 'next/link'
import { topTweets } from 'shared-data/tweets'
import { Button } from 'ui'
import { TweetCard } from 'ui-patterns/TweetCard'

const STAIRCASE_COLUMNS = 5
const TWEETS_PER_COL = 3
const STAIRCASE_OFFSET = 48

export function CommunitySection() {
  const tweets = topTweets.slice(0, STAIRCASE_COLUMNS * TWEETS_PER_COL)
  const columns: (typeof tweets)[] = Array.from({ length: STAIRCASE_COLUMNS }, (_, i) =>
    tweets.slice(i * TWEETS_PER_COL, (i + 1) * TWEETS_PER_COL)
  )

  return (
    <div className="border-b border-border">
      <div className="pt-16 px-6">
        <div className="flex flex-col items-center gap-3 mb-12">
          <h3 className="text-2xl md:text-4xl text-center text-foreground-lighter">
            Join the community
          </h3>
          <p className="text-foreground-lighter text-center">
            Discover what our community has to say about their Supabase experience.
          </p>
          <Button asChild type="default" size="small" className="mt-2">
            <Link href="https://discord.supabase.com/" target="_blank">
              Join us on Discord
            </Link>
          </Button>
        </div>

        <div
          className="relative overflow-hidden max-h-[600px] pt-24"
          style={{
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          }}
        >
          <div className="flex gap-4 max-w-[1480px] mx-auto">
            {columns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="flex-1 flex flex-col gap-4 min-w-0"
                style={{
                  transform: `translateY(-${Math.abs(colIdx - Math.floor(STAIRCASE_COLUMNS / 2)) * STAIRCASE_OFFSET}px)`,
                }}
              >
                {col.map((tweet) => (
                  <Link
                    key={tweet.url}
                    href={tweet.url}
                    target="_blank"
                    className="block group/tweet-card break-inside-avoid"
                  >
                    <TweetCard
                      handle={`@${tweet.handle}`}
                      quote={tweet.text}
                      img_url={tweet.img_url}
                    />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
