import Link from 'next/link'
import Image from 'next/image'
import { LW_SITE_URL, LW8_END_DATE } from './data/constants'

const Card = ({
  className,
  innerClassName,
  children,
}: {
  className?: string
  innerClassName?: string
  children: any
}) => (
  <div
    className={[
      'group relative p-[1px] bg-gradient-to-b from-scale-100/90 to-scale-100/60 rounded-xl overflow-hidden shadow-sm',
      className,
    ].join(' ')}
  >
    <div
      className={[
        'bg-scale-100 text-sm text-foreground-light p-2 flex flex-row justify-between items-center backdrop-blur-md h-full',
        innerClassName,
      ].join(' ')}
    >
      {children}
    </div>
  </div>
)

const LWAnnouncement = ({
  title,
  className,
  cardClassName,
  cardInnerClassName,
}: {
  title?: string
  className?: string
  cardClassName?: string
  cardInnerClassName?: string
}) => {
  const isLw8Finished = Date.parse(LW8_END_DATE) < Date.now()
  if (isLw8Finished) return null

  return (
    <div
      className={[
        'w-full opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both]',
        className,
      ].join(' ')}
    >
      <Card
        className={['border hover:border-scale-800 transition-colors', cardClassName].join(' ')}
        innerClassName={['!bg-opacity-70', cardInnerClassName].join(' ')}
      >
        <Link
          href={LW_SITE_URL}
          className="flex flex-row justify-between items-center w-full h-full gap-2 text-left no-underline"
        >
          <div className="relative flex-shrink flex items-center p-2 w-2/3 md:w-auto">
            <div className="flex flex-col gap-1 sm:pl-2">
              <div className="flex items-center gap-2">
                <span className="text-foreground">Launch Week 8</span>
              </div>
              <span className="text-foreground-light">Explore all the announcements</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center !aspect-video h-[80px] md:h-[80px] gap-2 z-10 rounded overflow-hidden">
            {/* <div className="absolute z-20 w-4 h-4 text-white opacity-70">
              <svg viewBox="0 0 81 91" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M76.5621 37.998C82.3369 41.3321 82.3369 49.6673 76.5621 53.0014L13.2198 89.5721C7.44504 92.9062 0.226562 88.7386 0.226562 82.0704L0.226566 8.92901C0.226566 2.26085 7.44506 -1.90673 13.2199 1.42735L76.5621 37.998Z"
                  fill="currentColor"
                />
              </svg>
            </div> */}
            <Image
              src="https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw8/assets/lw8-og.jpg"
              alt="Launch Week 8"
              layout="fill"
              objectFit="cover"
            />
          </div>
        </Link>
      </Card>
    </div>
  )
}

export default LWAnnouncement
