import Image from 'next/image'
import { cn } from 'ui/src/lib/utils'

interface TweetCard {
  handle: string
  quote: string | React.ReactNode
  img_url: string
  className?: string
}

export function TweetCard(props: TweetCard) {
  return (
    <div
      className={cn(
        'bg-surface-75',
        'border group-hover/tweet-card:border-foreground-muted transition-colors',
        'rounded-2xl p-6',
        'drop-shadow-xs',
        props.className
      )}
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
        </div>
      </div>

      <p className="text-foreground-lighter mt-3 text-base whitespace-pre-line">{props.quote}</p>
    </div>
  )
}
