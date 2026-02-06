'use client'

import { ArrowRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

import SectionHeader from 'components/UI/SectionHeader'
import { Button, cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'

import type { CustomerStoryType } from '~/data/CustomerStories'
import customerStories from '~/data/CustomerStories'
import { useSendTelemetryEvent } from '~/lib/telemetry'

const CustomersSliderMobile = dynamic(() => import('./CustomersSliderMobile'))
const CutomsersSliderDesktop = dynamic(() => import('./CutomsersSliderDesktop'))

const CustomerStories = () => (
  <div id="customers" className="overflow-hidden pb-16 md:pb-24">
    <SectionContainer className="!pb-8 w-full flex gap-4 justify-between flex-col xl:flex-row xl:items-end">
      <SectionHeader
        title="Trusted by the world’s"
        title_alt=" most innovative companies."
        subtitle="Customer Stories"
        paragraph="See how Supabase empowers companies of all sizes to accelerate their growth and streamline their work."
        className="xl:w-1/2"
      />
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/customers">View all stories</Link>
        </Button>
        <Button asChild type="default">
          <Link href="/events">View events</Link>
        </Button>
      </div>
    </SectionContainer>
    <CustomersSliderMobile columns={compositionCols} className="md:hidden w-full h-[230px]" />
    <CutomsersSliderDesktop columns={compositionCols} className="hidden md:flex" />
  </div>
)

/**
 * Utils & Components
 */

const getCustomer: (customer: string, linked: boolean) => ExtendedCustomerStoryType = (
  customer,
  linked
) => ({
  ...customerStories.find((story: CustomerStoryType) => customer.includes(story.organization!))!,
  linked,
})

const compositionCols: CompositionColType[] = [
  {
    type: 'narrow',
    cards: [getCustomer('Quivr', false), getCustomer('Tinloof', false)],
  },
  {
    type: 'narrow',
    cards: [
      {
        logo: '/images/customers/logos/1password.png',
        logo_inverse: '/images/customers/logos/light/1password.png',
        organization: '1Password',
      },
      getCustomer('Next Door Lending', true),
    ],
  },
  {
    type: 'expanded',
    cards: [getCustomer('Maergo', true)],
  },
  {
    type: 'narrow',
    cards: [
      getCustomer('Shotgun', true),
      {
        logo: '/images/customers/logos/mozilla.png',
        logo_inverse: '/images/customers/logos/light/mozilla.png',
        organization: 'Mozilla',
        linked: false,
      },
    ],
  },
  {
    type: 'expanded',
    cards: [getCustomer('Chatbase', true)],
  },
  {
    type: 'narrow',
    cards: [getCustomer('Mobbin', true), getCustomer('HappyTeams', true)],
  },
  {
    type: 'expanded',
    cards: [getCustomer('Pebblely', true)],
  },
]

export const CompositionCol: React.FC<CompositionColProps> = ({ column, className }) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  return (
    <div className={className}>
      {column.cards.map((customer) =>
        column.type === 'expanded' ? (
          <Link
            href={customer.url!}
            key={customer.organization}
            className="col-span-12 md:col-span-4 w-full md:w-[450px] h-full"
            onClick={() =>
              sendTelemetryEvent({
                action: 'homepage_customer_story_card_clicked',
                properties: { customer: customer.organization, cardType: 'expanded' },
              })
            }
          >
            <CustomerCard size="expanded" customer={customer} />
          </Link>
        ) : customer.linked ? (
          <Link
            href={customer.url!}
            key={customer.organization}
            className="col-span-12 md:col-span-4 w-full h-full flex-grow"
            onClick={() =>
              sendTelemetryEvent({
                action: 'homepage_customer_story_card_clicked',
                properties: { customer: customer.organization, cardType: 'narrow' },
              })
            }
          >
            <CustomerCard size="narrow" customer={customer} />
          </Link>
        ) : (
          <CustomerCard
            size="narrow"
            key={customer.organization}
            customer={customer}
            className=" pointer-events-none"
          />
        )
      )}
    </div>
  )
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  className,
  size,
  children,
  ...rest
}) => {
  const { resolvedTheme } = useTheme()
  const showLogoInverse = customer.logo_inverse && resolvedTheme?.includes('dark')
  const showLogo = !showLogoInverse && customer.logo

  const LogoComponent = ({ logoImage, className }: { logoImage: string; className?: string }) => (
    <div className="relative box-content opacity-50 group-hover:opacity-75 transition-opacity">
      <div className="relative h-[33px] w-auto max-w-[145px]">
        <Image
          src={logoImage}
          alt={customer.title!}
          fill
          priority
          sizes="100%"
          className={cn('object-contain object-left', className)}
        />
      </div>
    </div>
  )

  switch (size) {
    case 'narrow':
      return (
        <Panel
          hasActiveOnHover
          outerClassName={cn('h-full w-full md:w-[250px] h-full flex-grow', className)}
          innerClassName="flex items-center justify-center"
        >
          <Image
            key={customer.organization}
            src={customer.logo!}
            alt={customer.organization!}
            width={300}
            height={150}
            priority
            className="w-full opacity-50 group-hover/panel:opacity-75 transition-opacity max-w-[140px] filter dark:invert"
          />
        </Panel>
      )
    case 'expanded':
      return (
        <Panel
          hasActiveOnHover
          outerClassName={cn(
            'relative',
            'w-full h-full',
            'group',
            'cursor-pointer',
            'overflow-hidden',
            'text-left',
            'transition',
            className
          )}
          innerClassName="h-full p-4 md:p-8 flex flex-col gap-6 justify-between"
          {...rest}
        >
          <ArrowRight className="not-sr-only absolute top-8 right-8 -rotate-45 stroke-1 -translate-x-1 translate-y-1 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />

          {showLogoInverse && <LogoComponent logoImage={customer.logo_inverse!} />}
          {showLogo && <LogoComponent logoImage={customer.logo!} />}

          <p className="text-base text-foreground-lighter">{customer.title}</p>
          {children && <span className="text-sm text-foreground-light flex-grow">{children}</span>}
        </Panel>
      )
  }
}

/** Types */

type ColSize = 'narrow' | 'expanded'
type ExtendedCustomerStoryType = Partial<CustomerStoryType> & { linked?: boolean }

export type CompositionColType = {
  type: ColSize
  cards: ExtendedCustomerStoryType[]
}

interface CompositionColProps {
  column: CompositionColType
  className?: string
}

interface CustomerCardProps extends PropsWithChildren {
  customer: ExtendedCustomerStoryType
  className?: string
  size?: ColSize
}

export default CustomerStories
