import { PropsWithChildren } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { range } from 'lodash'
import { ArrowRight } from 'lucide-react'
import { Button, cn } from 'ui'

import SectionContainer from '~/components/Layouts/SectionContainer'
import SectionHeader from 'components/UI/SectionHeader'
import Panel from '~/components/Panel'

import customerStories from '~/data/CustomerStories'
import type { CustomerStoryType } from '~/data/CustomerStories'

const getCustomer = (customer: string, linked: boolean) => ({
  ...customerStories.find((story: any) => customer.includes(story.organization)),
  linked,
})

const CustomerStories = () => {
  const composition = [
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

  const compositionGap = 'gap-4'

  return (
    <div id="customers" className="overflow-hidden">
      <SectionContainer className="!pb-8 w-full flex gap-4 justify-between flex-col xl:flex-row xl:items-end">
        <SectionHeader
          title={'Infrastructure'}
          title_alt={' to innovate and scale with ease.'}
          subtitle={'Customer Stories'}
          paragraph={
            'See how Supabase empowers companies of all sizes to accelerate their growth and streamline their work.'
          }
          className="xl:w-1/2"
        />
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/customers">View all stories</Link>
          </Button>
          <Button asChild type="default">
            <Link href="/events">View Events</Link>
          </Button>
        </div>
      </SectionContainer>
      <div
        className={cn(
          'group/tw-marquee w-full flex items-stretch h-[300px] min-w-[300px] nowrap mb-16 md:mb-24 lg:mb-24',
          compositionGap
        )}
      >
        {range(0, 2).map((_, idx1: number) => (
          <div
            key={`row-${idx1}`}
            className={cn(
              'relative',
              'left-0 z-10',
              'w-auto h-full',
              'flex gap-4 items-end',
              'motion-safe:run motion-safe:animate-[marquee_50000ms_linear_both_infinite] group-hover/tw-marquee:pause',
              'will-change-transform transition-transform',
              compositionGap
            )}
          >
            {composition.map((group, idx2) => (
              <div
                key={`customers-col-${idx1}-${idx2}`}
                className={cn(
                  'flex flex-col !h-full',
                  compositionGap,
                  group.type === 'expanded' ? 'w-[450px]' : 'w-[250px]'
                )}
              >
                {group.cards.map((customer: any, idx3) =>
                  group.type === 'expanded' ? (
                    <Link
                      href={`${customer.url}`}
                      key={customer.organization}
                      className="col-span-12 md:col-span-4 w-[450px] h-full"
                    >
                      <CustomerCard size="expanded" customer={customer} />
                    </Link>
                  ) : customer.linked ? (
                    <Link
                      href={`${customer.url}`}
                      key={customer.organization}
                      className="col-span-12 md:col-span-4 h-full flex-grow"
                    >
                      <CustomerCard size="narrow" customer={customer} />
                    </Link>
                  ) : (
                    <CustomerCard
                      size="narrow"
                      key={customer.organization}
                      customer={customer}
                      className="pointer-events-none"
                    />
                  )
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CustomerCardProps extends PropsWithChildren {
  customer: CustomerStoryType
  className?: string
  size?: 'narrow' | 'expanded'
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
          alt={customer.title}
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
          outerClassName={cn('h-full w-[250px] h-full flex-grow', className)}
          innerClassName="flex items-center justify-center"
        >
          <Image
            key={customer.organization}
            src={customer.logo}
            alt={customer.organization}
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
            'h-full',
            'group',
            'cursor-pointer',
            'overflow-hidden',
            'text-left',
            'transition',
            className
          )}
          innerClassName="h-full p-8 flex flex-col gap-6 justify-between"
          {...rest}
        >
          <ArrowRight className="not-sr-only absolute top-8 right-8 -rotate-45 stroke-1 -translate-x-1 translate-y-1 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />

          {showLogoInverse && <LogoComponent logoImage={customer.logo_inverse!} />}
          {showLogo && <LogoComponent logoImage={customer.logo} />}

          <p className="text-base text-foreground-lighter">{customer.title}</p>
          {children && <span className="text-sm text-foreground-light flex-grow">{children}</span>}
        </Panel>
      )
  }
}

export default CustomerStories
