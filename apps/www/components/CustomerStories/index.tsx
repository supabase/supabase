import Link from 'next/link'
import Image from 'next/image'
import { range } from 'lodash'
import { Button, cn } from 'ui'

import { GlassPanel } from 'ui-patterns/GlassPanel'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TextLink from '~/components/TextLink'
import SectionHeader from 'components/UI/SectionHeader'
import customerStories from '~/data/CustomerStories'
import Panel from '~/components/Panel'

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
          'group w-full flex items-stretch h-[300px] min-w-[300px] nowrap mb-16 md:mb-24 lg:mb-24',
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
              'run animate-marquee group-hover:pause',
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
                      <Panel hasActiveOnHover outerClassName="h-full">
                        <GlassPanel
                          {...customer}
                          background={false}
                          className="border-none dark:filter dark:[&_img]:!invert"
                          showIconBg={true}
                          showLink={true}
                        >
                          {customer.description}
                        </GlassPanel>
                      </Panel>
                    </Link>
                  ) : customer.linked ? (
                    <Link
                      href={`${customer.url}`}
                      key={customer.organization}
                      className="col-span-12 md:col-span-4 h-full flex-grow"
                    >
                      <CustomerCard customer={customer} />
                    </Link>
                  ) : (
                    <CustomerCard
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

interface CustomerCardProps {
  customer: any
  className?: string
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, className }) => (
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
      className="w-full opacity-60 max-w-[140px]"
    />
  </Panel>
)

export default CustomerStories
