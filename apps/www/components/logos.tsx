import { cn } from 'ui'
import { range } from 'lodash'

const Logos: React.FC = () => {
  const gap = 'gap-4 lg:gap-8'

  return (
    <div className="pb-14 md:pb-24" suppressHydrationWarning>
      <div className="max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto animadura px-5 lg:px-12">
        <div
          className={cn(
            'relative w-full mx-auto max-w-4xl opacity-90 dark:opacity-70',
            'overflow-hidden',
            'flex flex-nowrap justify-center',
            "before:content[''] before:absolute before:inset-0 before:w-full before:bg-[linear-gradient(to_right,hsl(var(--background-default))_0%,transparent_10%,transparent_90%,hsl(var(--background-default))_100%)] before:z-10",
            gap
          )}
        >
          {range(0, 4).map((_, i) => (
            <LogosRow
              key={`logos-group-${i}`}
              className={cn(
                gap,
                'flex flex-nowrap w-fit',
                'animate-[marquee_90000ms_linear_both_infinite] will-change-transform',
                'motion-reduce:animate-none motion-reduce:will-change-none'
              )}
            />
          ))}
        </div>
      </div>
      <p className="w-full text-center text-sm text-foreground-lighter mt-6 lg:mt-8">
        Trusted by fast-growing companies worldwide
      </p>
    </div>
  )
}

const logos = [
  {
    image: `/images/logos/publicity/mozilla.svg`,
    alt: 'mozilla',
    name: 'mozilla',
  },
  {
    image: `/images/logos/publicity/1password.svg`,
    alt: '1password',
    name: '1password',
  },
  {
    image: `/images/logos/publicity/pwc.svg`,
    alt: 'pwc',
    name: 'pwc',
  },
  {
    image: `/images/logos/publicity/pika.svg`,
    alt: 'pika',
    name: 'pika',
  },
  {
    image: `/images/logos/publicity/humata.svg`,
    alt: 'humata',
    name: 'humata',
  },
  {
    image: `/images/logos/publicity/krea.svg`,
    alt: 'krea',
    name: 'krea',
  },
  {
    image: `/images/logos/publicity/udio.svg`,
    alt: 'udio',
    name: 'udio',
  },
  {
    image: `/images/logos/publicity/langchain.svg`,
    alt: 'langchain',
    name: 'langchain',
  },
  {
    image: `/images/logos/publicity/resend.svg`,
    alt: 'resend',
    name: 'resend',
  },
  {
    image: `/images/logos/publicity/loops.svg`,
    alt: 'loops',
    name: 'loops',
  },
  {
    image: `/images/logos/publicity/mobbin.svg`,
    alt: 'mobbin',
    name: 'mobbin',
  },
  {
    image: `/images/logos/publicity/gopuff.svg`,
    alt: 'gopuff',
    name: 'gopuff',
  },
  {
    image: `/images/logos/publicity/chatbase.svg`,
    alt: 'chatbase',
    name: 'chatbase',
  },
  {
    image: `/images/logos/publicity/betashares.svg`,
    alt: 'betashares',
    name: 'betashares',
  },
]

const LogosRow: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn(className)} suppressHydrationWarning>
    {logos.map((logo) => (
      <div key={`logos-group-${logo.name}`} className="h-12 lg:h-12 w-max !inline-block">
        <img
          src={logo.image}
          alt={logo.alt}
          className={'h-12 lg:h-12 !min-h-12 lg:!min-h-12 w-auto block'}
          draggable={false}
        />
      </div>
    ))}
  </div>
)

export default Logos
