import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useBreakpoint } from 'common'
import { IconArrowUpRight } from 'ui'

import SectionContainer from '~/components/Layouts/SectionContainer'

interface CardInterface {
  type?: string
  avatar?: string
  author?: string
  role?: string
  quote?: string | React.ReactNode
  abstract?: string
  image?: string
  url?: string
  logo?: string
  customer?: string
}

interface Props {
  title: string | React.ReactNode
  customers: CardInterface[]
  secondaryLinks: CardInterface[]
}

const CustomerQuotesSection = (props: Props) => {
  const isSm = useBreakpoint(768)
  const { basePath } = useRouter()

  const Card = (card: CardInterface) => (
    <div className="bg-scale-100 dark:bg-scale-200 hover:border-scale-600 hover:dark:border-scale-700 border-scale-300 dark:border-scale-400 rounded-2xl border p-6 drop-shadow-sm flex flex-col justify-between">
      <div className="flex flex-col gap-4">
        <div className="h-24 w-full flex items-center justify-center pb-3">
          <div className="relative w-full flex items-center justify-center h-10">
            <Image
              src={card.image!}
              alt={`Supabase + ${card.customer}`}
              layout="fill"
              objectFit="contain"
              objectPosition="center"
            />
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-scale-1200 font-medium">{card.author}</p>
          <p className="text-scale-900 text-sm">{card.role}</p>
        </div>
        <p className="text-scale-900 mt-1 text-base">{card.quote}</p>
      </div>

      {card.url && (
        <div className="text-brand-900 border-t mt-4 pt-4 cursor-pointer text-sm flex items-center justify-between">
          <span>Read Customer Story</span>
          <IconArrowUpRight />
        </div>
      )}
    </div>
  )

  return (
    <div className="py-16 sm:py-18 md:py-24 bg-scale-400 dark:bg-transparent">
      <div className="relative h-[300px] w-screen mx-auto md:w-full -mb-32 z-0">
        <Image
          src="/images/product/vector/community/vector-graphics-dark.svg"
          alt="vector graphic"
          layout="fill"
          objectPosition={isSm ? '49%' : '51%'}
          objectFit={isSm ? 'cover' : 'contain'}
        />
      </div>
      <SectionContainer className="!py-0">
        <div className="col-span-12 text-center relative z-10">
          <h3 className="text-3xl md:text-4xl heading-gradient">{props.title}</h3>
        </div>
        <div className="relative mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-8 pt-16 pb-0">
          {props.customers.map((customer) => (
            <Link href={`${basePath}${customer.url}`}>
              <a className="h-full flex">
                <Card {...customer} />
              </a>
            </Link>
          ))}
          <div className="w-full h-full flex flex-col justify-stretch gap-4 xl:gap-8">
            {props.secondaryLinks.map((link) => (
              <Link href={`${basePath}${link.url}`}>
                <a className="w-full h-auto lg:h-full bg-scale-100 dark:bg-scale-200 hover:border-scale-600 hover:dark:border-scale-700 border-scale-300 dark:border-scale-400 rounded-2xl border p-6 drop-shadow-sm flex flex-col justify-center items-center py-16">
                  <div className="relative w-full flex items-center justify-center h-10 pb-3">
                    <Image
                      src={link.image!}
                      alt={`Supabase + ${link.customer}`}
                      layout="fill"
                      objectFit="contain"
                      objectPosition="center"
                    />
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </SectionContainer>
    </div>
  )
}

export default CustomerQuotesSection
