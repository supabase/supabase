import Image from 'next/image'
import { SurveySectionBreak } from './SurveySectionBreak'

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
    <>
      <aside className="border-y border-muted bg-alternative relative">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("/survey/pattern-front.svg")',
            backgroundSize: '14.5px 15px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'top left',
          }}
        />
        <div className="relative max-w-[60rem] mx-auto border-x border-muted flex flex-col gap-4 text-center items-center px-6 py-24 bg-alternative">
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
      </aside>
      <SurveySectionBreak />
    </>
  )
}
