import { IconTwitter } from 'ui'
import Image from 'next/image'

interface TweetCard {
  handle: string
  quote: string
  img_url: string
}

function TweetCard(props: TweetCard) {
  return (
    <div
      className="

      dark:bg-scale-300 border-scale-300 dark:border-scale-400

      rounded-md border bg-white p-6
      drop-shadow-sm


    "
    >
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 overflow-hidden rounded-full border dark:border-gray-600">
            <Image
              src={props.img_url}
              layout="responsive"
              width="64"
              height="64"
              alt={`${props.handle} twitter image`}
            />
          </div>
          <p className="text-scale-1200 mt-3 text-sm font-medium">{props.handle}</p>
          <div
            className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: '#00acee' }}
          >
            <div className="text-white">
              <IconTwitter fill={'white'} size={12} />
            </div>
          </div>
        </div>
      </div>

      <p>
        <p className="text-scale-1100 mt-3 text-base">"{props.quote}"</p>
      </p>
    </div>
  )
}
export default TweetCard
