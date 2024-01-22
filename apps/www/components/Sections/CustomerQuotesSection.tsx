import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { IconArrowUpRight } from 'ui'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'

import SectionContainer from '~/components/Layouts/SectionContainer'
import CustomersVisual from '~/components/Products/VectorAI/CustomersVisual'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'

interface Customer {
  type?: string
  avatar?: string
  author?: string
  role?: string
  target?: string
  quote?: string | React.ReactNode
  abstract?: string
  image?: string
  url?: string
  logo?: string
  customer?: string
}

interface Card {
  customer: any
  index: number
}

interface Props {
  title: string | React.ReactNode
  customers: Customer[]
}

const CustomerQuotesSection = (props: Props) => {
  const { basePath } = useRouter()
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const Card = ({ customer, index }: Card) => {
    const { resolvedTheme } = useTheme()
    const logo = `/images/customers/logos/${!resolvedTheme?.includes('dark') ? '' : 'light/'}${
      customer.customer
    }.png`

    const initial = INITIAL_BOTTOM
    const animate = getAnimation({ delay: index * 0.1 })

    return (
      <m.div
        initial={initial}
        animate={isInView ? animate : initial}
        className="bg-background hover:border-control border-background-overlay-default rounded-2xl border p-6 drop-shadow-sm flex flex-col justify-between"
      >
        <div className="flex flex-col gap-4">
          <div className="h-24 w-full flex items-center justify-center pb-3">
            <div className="relative w-full flex items-center justify-center h-10">
              <Image
                src={logo}
                alt={`Supabase + ${customer.customer}`}
                layout="fill"
                objectFit="contain"
                objectPosition="center"
              />
            </div>
          </div>
          <div className="border-t pt-4">
            <blockquote className="text-foreground-light text-base">{customer.quote}</blockquote>
          </div>
        </div>

        <div>
          <p className="text-foreground-lighter mt-4">
            {customer.author}, {customer.role}
          </p>
          {customer.url && (
            <div className="text-brand border-t mt-4 pt-4 cursor-pointer text-sm flex items-center justify-between">
              <span>Read Customer Story</span>
              <IconArrowUpRight />
            </div>
          )}
        </div>
      </m.div>
    )
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="py-16 sm:py-18 md:py-24 overflow-hidden">
        <div className="relative h-[300px] w-[300vw] left-[-98vw] md:left-0 mx-auto md:w-full -mb-32 z-0">
          <CustomersVisual />
        </div>
        <SectionContainer className="!py-0">
          <div className="col-span-12 text-center relative z-10">
            <h3 className="text-3xl md:text-4xl heading-gradient">{props.title}</h3>
          </div>
          <div
            ref={ref}
            className="relative mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-8 pt-16 pb-0"
          >
            {props.customers.map((customer, i: number) => (
              <Link
                href={`${basePath}${customer.url}`}
                key={customer.customer}
                className="h-full flex"
                target={customer.target ?? '_self'}
              >
                <Card customer={customer} index={i} />
              </Link>
            ))}
          </div>
        </SectionContainer>
      </div>
    </LazyMotion>
  )
}

export default CustomerQuotesSection
