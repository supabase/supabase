import Image from 'next/image'

export function SurveyPullQuote({
  quote,
  author,
  authorPosition,
  authorAvatar,
}: {
  quote: string
  author: string
  authorPosition: string
  authorAvatar: string
}) {
  return (
    <div className="flex flex-col gap-4 text-center items-center py-8">
      {/* TODO add quote marks via CSS instead, hang quote marks outside*/}
      <p className="text-foreground-lighter text-2xl text-balance max-w-prose">“{quote}”</p>
      <Image
        src={authorAvatar || '/images/twitter-profiles/qhvO9V6x_400x400.jpg'}
        width={48}
        height={48}
        alt={`${author}'s avatar`}
        className="h-10 w-10 overflow-hidden rounded-full border border-control"
      />
      <p>
        {author}
        <br />
        <span className="text-foreground-muted text-sm">{authorPosition}</span>
      </p>
    </div>
  )
}
