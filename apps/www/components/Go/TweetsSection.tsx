'use client'

import { useBreakpoint } from 'common'
import { range } from 'lib/helpers'
import type { GoTweetsSection } from 'marketing'
import Link from 'next/link'
import { topTweets } from 'shared-data/tweets'
import { Button, cn } from 'ui'
import { TweetCard } from 'ui-patterns/TweetCard'

function MobileCarousel() {
  return (
    <div
      className="tweets-carousel flex gap-3 overflow-x-auto snap-x snap-mandatory px-6 pb-4"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
    >
      <style>{`.tweets-carousel::-webkit-scrollbar { display: none; }`}</style>
      {topTweets.slice(0, 9).map((tweet: any) => (
        <Link
          key={tweet.text}
          href={tweet.url}
          target="_blank"
          rel="noopener noreferrer"
          className="snap-start shrink-0 w-[85vw] max-w-[320px] sm:w-[55vw] group/tweet-card"
        >
          <TweetCard handle={`@${tweet.handle}`} quote={tweet.text} img_url={tweet.img_url} />
        </Link>
      ))}
    </div>
  )
}

function DesktopMarquee() {
  const isMd = useBreakpoint(1024)
  const visibleTweets = topTweets.slice(0, isMd ? 12 : 18)

  return (
    <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden">
      <div className="group relative transition-all max-h-[500px] w-auto flex flex-nowrap">
        {range(0, 3).map((_, idx) => (
          <div
            key={`tweets-range-${idx}`}
            className={cn(
              'columns-2 lg:columns-3 xl:columns-5',
              'gap-4 h-fit pr-4',
              'min-w-[900px] max-w-[900px]',
              'xl:min-w-[1600px] xl:max-w-[1600px]',
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
                rel="noopener noreferrer"
                className={cn(
                  'min-w-[200px]',
                  'mb-4 z-0 break-inside-avoid-column block group/tweet-card',
                  i > 12 && 'hidden lg:block'
                )}
              >
                <TweetCard handle={`@${tweet.handle}`} quote={tweet.text} img_url={tweet.img_url} />
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute pointer-events-none w-full h-full inset-0 top-auto lg:bg-[radial-gradient(50%_100%_at_50%_0,transparent_0%,transparent_50%,hsl(var(--background-default))_100%)]" />
    </div>
  )
}

export default function TweetsSection({ section }: { section: GoTweetsSection }) {
  return (
    <div>
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
      <div className="lg:hidden">
        <MobileCarousel />
      </div>
      <div className="hidden lg:block">
        <DesktopMarquee />
      </div>
    </div>
  )
}
