import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button, IconMessageCircle } from 'ui'
import Tweets from '../../data/tweets/Tweets.json'
import Link from 'next/link'
import { TweetCard } from 'ui-patterns/TweetCard'

function TwitterSocialProof() {
  // base path for images
  const { basePath } = useRouter()

  const [tweets, setTweets] = useState(Tweets.slice(0, 10))
  const [showButton, setShowButton] = useState(true)

  const handleShowMore = () => {
    setTweets((prevTweets) => [
      ...prevTweets,
      ...Tweets.slice(prevTweets.length, prevTweets.length + 10),
    ])

    if (tweets.length >= Tweets.length) {
      setShowButton(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 text-center">
          <h3 className="h2">Join the community</h3>
          <p className="p">
            Supported by a network of early advocates, contributors, and champions.
          </p>
          <div className="my-8 flex justify-center gap-2">
            <Button asChild size="small" iconRight={<IconMessageCircle size={14} />} type="default">
              <Link
                href={'https://github.com/supabase/supabase/discussions'}
                target="_blank"
                tabIndex={-1}
              >
                GitHub discussions
              </Link>
            </Button>
            <Button asChild type="default" size="small" iconRight={<IconMessageCircle size={14} />}>
              <Link href={'https://discord.supabase.com/'} target="_blank" tabIndex={-1}>
                Discord
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div
          className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 overflow-hidden relative transition-all`}
        >
          {showButton && (
            <div
              className={`absolute bottom-0 left-0 z-10 w-full h-[400px] bg-gradient-to-t from-background via-background`}
            />
          )}
          {tweets.map((tweet: any, i: number) => (
            <div className="mb-4 z-0 break-inside-avoid-column" key={i}>
              <Link href={tweet.url} target="_blank">
                <TweetCard
                  handle={`@${tweet.handle}`}
                  quote={tweet.text}
                  img_url={`${basePath}${tweet.img_url}`}
                />
              </Link>
            </div>
          ))}
          {showButton && (
            <div className="absolute flex justify-center bottom-0 left-0 right-0 z-20 mb-10">
              <Button type="default" size="small" onClick={() => handleShowMore()}>
                Show More
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default TwitterSocialProof
