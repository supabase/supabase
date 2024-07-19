import Image from 'next/image'

interface TweetCard {
  handle: string
  quote: string | React.ReactNode
  img_url: string
}

export function TweetCard(props: TweetCard) {
  return (
    <div
      className="
      bg-surface-100 border-overlay
      rounded-2xl border p-6
      drop-shadow-sm
    "
    >
      <div className="relative">
        <div className="flex items-center gap-2">
          {props.img_url ? (
            <div className="h-10 w-10 overflow-hidden rounded-full border border-control">
              <Image
                src={props.img_url}
                width="64"
                height="64"
                alt={`${props.handle} twitter image`}
              />
            </div>
          ) : (
            <div className="w-6" />
          )}
          <p className="text-foreground text-sm font-medium">{props.handle}</p>
          <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black">
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

      <p className="text-foreground-muted mt-3 text-base">"{props.quote}"</p>
    </div>
  )
}
