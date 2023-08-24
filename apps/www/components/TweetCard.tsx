import Image from 'next/image'

interface TweetCard {
  handle: string
  quote: string | React.ReactNode
  img_url: string
}

function TweetCard(props: TweetCard) {
  return (
    <div
      className="

      dark:bg-scale-300 border-scale-300 dark:border-scale-400

      rounded-2xl border bg-white p-6
      drop-shadow-sm


    "
    >
      <div className="relative">
        <div className="flex items-center gap-2">
          {props.img_url ? (
            <div className="h-10 w-10 overflow-hidden rounded-full border dark:border-gray-600">
              <Image
                src={props.img_url}
                layout="responsive"
                width="64"
                height="64"
                alt={`${props.handle} twitter image`}
              />
            </div>
          ) : (
            <div className="w-6" />
          )}
          <p
            className={['text-scale-1200 text-sm font-medium -mt-1', props.img_url && 'mt-3'].join(
              ' '
            )}
          >
            {props.handle}
          </p>
          <div
            className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: '#000' }}
          >
            <svg
              className="h-[12px] w-[12px]"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>
      </div>

      <p className="text-scale-900 mt-3 text-base">"{props.quote}"</p>
    </div>
  )
}
export default TweetCard
