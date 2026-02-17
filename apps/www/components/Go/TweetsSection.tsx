'use client'

import { useBreakpoint } from 'common'
import { range } from 'lib/helpers'
import type { GoTweetsSection } from 'marketing'
import Link from 'next/link'
import { topTweets } from 'shared-data/tweets'
import { Button, cn } from 'ui'
import { TweetCard } from 'ui-patterns/TweetCard'

export default function TweetsSection({ section }: { section: GoTweetsSection }) {
  const isSm = useBreakpoint()
  const isMd = useBreakpoint(1024)

  const visibleTweets = topTweets.slice(0, isSm ? 9 : isMd ? 12 : 18)

  return (
    <div className="py-16">
      {(section.title || section.description || section.ctas) && (
        <div className="text-center flex flex-col items-center gap-4 mb-8 px-8">
          {section.title && (
            <h2 className="text-2xl sm:text-3xl text-foreground">{section.title}</h2>
          )}
          {section.description && (
            <p className="text-foreground-lighter max-w-lg text-pretty">{section.description}</p>
          )}
          {section.ctas && section.ctas.length > 0 && (
            <div className="flex gap-2 mt-2">
              {section.ctas.map((cta, i) => (
                <Button
                  key={i}
                  asChild
                  type={cta.variant === 'secondary' ? 'default' : 'primary'}
                  size="small"
                >
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden">
        <div className="group relative transition-all max-h-[500px] w-auto flex flex-nowrap">
          {range(0, 3).map((_, idx) => (
            <div
              key={`tweets-range-${idx}`}
              className={cn(
                'columns-1 sm:columns-2 md:columns-2 lg:columns-3 xl:columns-5',
                'gap-4 h-fit pr-4',
                'w-screen min-w-[900px] max-w-[900px]',
                'xl:min-w-[1600px] max-w-[1600px]',
                'animate-[marquee_40000ms_linear_both_infinite] group-hover:pause',
                'motion-reduce:animate-none motion-reduce:will-change-none',
                'will-change-transform transition-transform'
              )}
            >
              {visibleTweets.map((tweet: any, i: number) => (
                <Link
                  key={tweet.text}
                  href={tweet.url}
                  target="_blank"
                  className={cn(
                    'min-w-[200px]',
                    'mb-4 z-0 break-inside-avoid-column block group/tweet-card',
                    i > 12 && 'hidden md:block'
                  )}
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
        <div className="absolute pointer-events-none w-full h-full inset-0 top-auto lg:bg-[radial-gradient(50%_100%_at_50%_0,transparent_0%,transparent_50%,hsl(var(--background-default))_100%)]" />
      </div>
    </div>
  )
}
