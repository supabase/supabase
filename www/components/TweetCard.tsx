import { IconTwitter, Typography } from '@supabase/ui'

function TweetCard() {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border dark:border-gray-600 p-6">
      <div className="relative">
        <img
          className="rounded-md w-12"
          src="https://pbs.twimg.com/profile_images/1086183037069549569/wUlAfmEd_400x400.jpg"
        />
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
        @JSummersMuir
      </Typography.Text>
      <Typography.Text>
        <p className="text-base mt-3 text-gray-900 dark:text-white">
          “I haven't really participated in community meetups before but the @supabase_io meetup
          (zoom call) was awesome.”
        </p>
      </Typography.Text>
    </div>
  )
}
export default TweetCard
