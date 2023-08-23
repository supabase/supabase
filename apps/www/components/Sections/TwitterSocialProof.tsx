import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button, IconMessageCircle } from 'ui'
import Tweets from '../../data/tweets/Tweets.json'
import TweetCard from '../TweetCard'
import Link from 'next/link'

function TwitterSocialProof() {
  // base path for images
  const { basePath } = useRouter()

  const [showAll, setShowAll] = useState(false)

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 text-center">
          <h3 className="h2">Join the community</h3>
          <p className="p">
            Supported by a network of early advocates, contributors, and champions.
          </p>
          <div className="my-8 flex justify-center gap-2">
            <Link href={'https://github.com/supabase/supabase/discussions'} passHref>
              <a target="_blank">
                <Button size="small" iconRight={<IconMessageCircle size={14} />} type="default">
                  GitHub discussions
                </Button>
              </a>
            </Link>
            <Link href={'https://discord.supabase.com/'} passHref>
              <a target="_blank">
                <Button type="default" size="small" iconRight={<IconMessageCircle size={14} />}>
                  Discord
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
      <div className="lg:-mx-10 xl:-mx-18 mt-6">
        <div className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 overflow-hidden relative h-[${!showAll ? 800 : 2500}px]`}>
          {!showAll && (
            <div className={`absolute bottom-0 left-0 z-10 w-full h-[50%] bg-gradient-to-t from-[#1c1c1c] via-[#1c1c1c]`} />
          )}
          {Tweets.map((tweet: any, i: number) => (
            <div className="mb-4 z-0 break-inside-avoid-column" key={i}>
              <Link href={tweet.url}>
                <a target="_blank">
                  <TweetCard
                    handle={`@${tweet.handle}`}
                    quote={tweet.text}
                    img_url={`${basePath}${tweet.img_url}`}
                  />
                </a>
              </Link>
            </div>
          ))}
          {!showAll && (
            <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 z-20">
              <Button type="default" size="small" onClick={() => setShowAll(true)}>
                Show All
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default TwitterSocialProof
