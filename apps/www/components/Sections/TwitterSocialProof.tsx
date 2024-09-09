import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from 'ui'
import { TweetCard } from 'ui-patterns/TweetCard'

import Tweets from '~/data/tweets/Tweets.json'
import { useBreakpoint } from 'common'
import React from 'react'

interface Props {
  className?: string
}

const TwitterSocialProof: React.FC<Props> = ({ className }) => {
  const { basePath } = useRouter()
  const isSm = useBreakpoint()
  const isMd = useBreakpoint(1024)
  const tweets = Tweets.slice(0, 18)

  return (
    <>
      <div
        className={cn(
          'columns-1 sm:columns-2 md:columns-2 lg:columns-3 xl:columns-5 gap-4 overflow-hidden relative transition-all h-fit',
          className
        )}
      >
        {tweets.slice(0, isSm ? 9 : isMd ? 12 : 18).map((tweet: any, i: number) => (
          <Link
            key={tweet.text}
            href={tweet.url}
            target="_blank"
            className={cn(
              'mb-4 z-0 break-inside-avoid-column block group',
              i > 12 && 'hidden md:block'
            )}
          >
            <TweetCard
              handle={`@${tweet.handle}`}
              quote={tweet.text}
              img_url={`${basePath}${tweet.img_url}`}
            />
          </Link>
        ))}
      </div>
      <div
        className="
            absolute pointer-events-none
            w-full h-full max-h-[400px] lg:max-h-none
            inset-0 top-auto
            lg:bg-[radial-gradient(50%_100%_at_50%_0,transparent_0%,hsl(var(--background-default))_100%)]
          "
      />
    </>
  )
}

export default TwitterSocialProof
