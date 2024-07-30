import Image from 'next/image'
import { useRouter } from 'next/router'
import ImageGrid from './ImageGrid'
import { cn } from 'ui'

export default function Logos() {
  const { basePath } = useRouter()

  const logos = [
    {
      image: `${basePath}/images/logos/publicity/mozilla.svg`,
      alt: 'mozilla',
      name: 'mozilla',
    },
    {
      image: `${basePath}/images/logos/publicity/1password.svg`,
      alt: '1password',
      name: '1password',
    },
    {
      image: `${basePath}/images/logos/publicity/pwc.svg`,
      alt: 'pwc',
      name: 'pwc',
    },
    {
      image: `${basePath}/images/logos/publicity/pika.svg`,
      alt: 'pika',
      name: 'pika',
    },
    {
      image: `${basePath}/images/logos/publicity/humata.svg`,
      alt: 'humata',
      name: 'humata',
    },
    {
      image: `${basePath}/images/logos/publicity/krea.svg`,
      alt: 'krea',
      name: 'krea',
    },
    {
      image: `${basePath}/images/logos/publicity/udio.svg`,
      alt: 'udio',
      name: 'udio',
    },
    {
      image: `${basePath}/images/logos/publicity/langchain.svg`,
      alt: 'langchain',
      name: 'langchain',
    },
    {
      image: `${basePath}/images/logos/publicity/resend.svg`,
      alt: 'resend',
      name: 'resend',
    },
    {
      image: `${basePath}/images/logos/publicity/loops.svg`,
      alt: 'loops',
      name: 'loops',
    },
    {
      image: `${basePath}/images/logos/publicity/mobbin.svg`,
      alt: 'mobbin',
      name: 'mobbin',
    },
    {
      image: `${basePath}/images/logos/publicity/gopuff.svg`,
      alt: 'gopuff',
      name: 'gopuff',
    },
    {
      image: `${basePath}/images/logos/publicity/chatbase.svg`,
      alt: 'chatbase',
      name: 'chatbase',
    },
    {
      image: `${basePath}/images/logos/publicity/betashares.svg`,
      alt: 'betashares',
      name: 'betashares',
    },
  ]

  return (
    <div className="py-12 pb:14 lg:pb-24">
      <div className="max-w-xl md:max-w-3xl lg:max-w-7xl mx-auto px-5 lg:px-12">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-5 lg:gap-x-4 lg:gap-y-7">
          {logos.map((logo) => (
            <div className={`relative h-4 w-16 md:w-21 lg:w-[128px] lg:h-6 overflow-auto`}>
              <Image
                src={logo.image}
                alt={logo.alt}
                fill
                sizes="100%"
                className={
                  cn('object-scale-down bg-no-repeat')
                  //   !removeFilter && 'contrast-0 filter opacity-50'
                }
              />
            </div>
          ))}
        </div>
        <p className="text-foreground-lighter text-center mt-8">
          Over 1 million developers trust Supabase
        </p>
      </div>
    </div>
  )
}
