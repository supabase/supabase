import Image from 'next/image'
import { useRouter } from 'next/router'

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
      <div className="max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto px-5 lg:px-12">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-5 lg:gap-x-8 lg:gap-y-7 overflow-hidden">
          {logos.map((logo) => (
            <div>
              <Image
                src={logo.image}
                alt={logo.alt}
                priority
                width={32}
                height={32}
                className={'w-16 lg:w-24 max-h-4 lg:max-h-5'}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
