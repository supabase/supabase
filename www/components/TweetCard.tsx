import { IconTwitter, Typography } from '@supabase/ui'
import Image from 'next/image'

interface TweetCard {
  handle: string
  quote: string
  img_url: string
}

function TweetCard(props: TweetCard) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-gray-600 p-6">
      <div className="relative">
        <div className="rounded-md w-12 h-12 border dark:border-gray-600 overflow-hidden">
          <Image src={props.img_url} layout="responsive" width="64" height="64" />
        </div>
        <div
          className="absolute -top-2 -left-2 w-6 h-6 flex justify-center items-center rounded-md"
          style={{ background: '#00acee' }}
        >
          <div className="text-white">
            <IconTwitter fill={'white'} size="tiny" />
          </div>
        </div>
      </div>
      <Typography.Text type="secondary" className="block mt-3">
        {props.handle}
      </Typography.Text>
      <Typography.Text>
        <p className="text-base mt-3 text-gray-900 dark:text-white">"{props.quote}"</p>
      </Typography.Text>
    </div>
  )
}
export default TweetCard
