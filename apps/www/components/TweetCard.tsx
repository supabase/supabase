import { IconTwitter } from '@supabase/ui'
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
      
      bg-white dark:bg-scale-300 rounded-md
    
      border border-scale-300 dark:border-scale-400 p-6
      drop-shadow-sm

    
    "
    >
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="rounded-full w-10 h-10 border dark:border-gray-600 overflow-hidden">
            <Image src={props.img_url} layout="responsive" width="64" height="64" />
          </div>
          <p className="text-sm font-medium text-scale-1200 mt-3">{props.handle}</p>
          <div
            className="absolute -left-1 -top-1 w-5 h-5 flex justify-center items-center rounded-full"
            style={{ background: '#00acee' }}
          >
            <div className="text-white">
              <IconTwitter fill={'white'} size={12} />
            </div>
          </div>
        </div>
      </div>

      <p>
        <p className="text-base mt-3 text-scale-1100">"{props.quote}"</p>
      </p>
    </div>
  )
}
export default TweetCard
