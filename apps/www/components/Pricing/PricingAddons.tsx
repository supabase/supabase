import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { Button, IconArrowUpRight, IconTable, cn } from 'ui'
import Link from 'next/link'
import CostControlAnimation from './CostControlAnimation'

const addons = [
  {
    id: 'addon-cost-control',
    name: 'Cost Control',
    heroImg: 'addons-cost-control',
    icon: 'compute-upgrade',
    price: 'Available on Pro Plan',
    description:
      'The Pro plan has a spend cap enabled by default to keep costs under control. If you expect a usage spike and need to go beyond the plan limits, simply switch off the spend cap to pay for additional resources.',
    leftCtaText: 'Learn about Cost Control',
    leftCtaLink: 'https://supabase.com/docs/guides/platform/spend-cap',
  },
  // {
  //   id: 'addon-compute',
  //   name: 'Scale compute up to 256GB per project',
  //   heroImg: 'addons-compute',
  //   icon: 'compute-upgrade',
  //   price: 'Starts from $10/month',
  //   description:
  //     'Paid plans include one Starter instance for free, additional compute add-ons are available if you need extra performance when scaling up Supabase.',
  //   leftCtaText: 'Compute Add-ons Documentation',
  //   leftCtaLink: 'https://supabase.com/docs/guides/platform/compute-add-ons',
  //   rightCtaText: 'See Pricing breakdown',
  //   rightCtaLink: '#open-modal',
  // },
  {
    id: 'addon-custom-domain',
    name: 'Custom Domain',
    heroImg: 'addons-domains-hero',
    icon: 'custom-domain-upgrade',
    price: 'Flat fee $10/month',
    description:
      'Use your own domain for your Supabase project to present a more polished product to your users.',
    leftCtaText: 'Documentation',
    leftCtaLink: 'https://supabase.com/docs/guides/platform/custom-domains',
    rightCtaText: 'See more',
    rightCtaLink: 'http://',
  },
  {
    id: 'addon-pitr',
    name: 'Point in Time Recovery',
    heroImg: 'addons-pitr-hero',
    icon: 'pitr-upgrade',
    price: 'Starts from $100/month',
    description: 'Roll back to any specific point in time and ensure that data is not lost.',
    leftCtaText: 'Documentation',
    leftCtaLink: 'https://supabase.com/docs/guides/platform/backups',
    rightCtaText: 'See Pricing breakdown',
    rightCtaLink: 'http://',
  },
]

interface Props {
  setShowComputeModal: any
}

const PricingAddons = ({ setShowComputeModal }: Props) => {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-foreground text-3xl">Fine-tune your project</h2>
        <p className="text-foreground-light mt-4 mb-8 lg:mb-16 text-lg">
          Go beyond the plan limits and level up your Supabase experience
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-16 mx-auto max-w-6xl">
        {addons.map((addon) => (
          <AddonCard key={addon.name} addon={addon} setShowComputeModal={setShowComputeModal} />
        ))}
      </div>
    </div>
  )
}

const AddonCard = ({ addon, setShowComputeModal }: any) => {
  const { basePath } = useRouter()
  const { resolvedTheme } = useTheme()

  const isHighlightCard = addon.id === 'addon-cost-control'

  const containerClasses = cn(
    'group relative bg-surface-100 border rounded-lg grid lg:grid-cols-3 gap-4 transition-colors',
    isHighlightCard && 'lg:grid-cols-2 col-span-2',
    !isHighlightCard && 'hover:border-stronger'
  )

  const Content = () => (
    <>
      {isHighlightCard && (
        <div className="relative lg:h-full p-8">
          <CostControlAnimation className="w-full lg:max-w-md aspect-video" />
        </div>
      )}
      <div className={cn('p-8 gap-4', !isHighlightCard && 'col-span-2')}>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-foreground-lighter">{addon.price}</p>
          <div className="flex items-center gap-2">
            {!isHighlightCard && (
              <Image
                src={`${basePath}/images/pricing/${addon.icon}${
                  resolvedTheme?.includes('dark') ? '' : '-light'
                }.svg`}
                className="file:"
                width={14}
                height={14}
                alt="Compute"
              />
            )}
            <h3 className={cn('text-sm text-foreground', isHighlightCard && 'text-2xl')}>
              {addon.name}
            </h3>
          </div>
          <p className="text-foreground-lighter text-[13px]">{addon.description}</p>
        </div>
        {isHighlightCard && (
          <div className="flex items-center gap-4 mt-4">
            <Button asChild size="tiny" type="default">
              <Link href={addon.leftCtaLink}>{addon.leftCtaText}</Link>
            </Button>
          </div>
        )}
      </div>
      {!isHighlightCard && (
        <div className="absolute right-0 lg:relative flex justify-end p-8">
          <IconArrowUpRight className="w-5 h-5 text-foreground-lighter group-hover:text-foreground transition-colors" />
        </div>
      )}
    </>
  )

  return isHighlightCard ? (
    <div className={containerClasses}>
      <Content />
    </div>
  ) : (
    <Link href={addon.leftCtaLink} className={containerClasses}>
      <Content />
    </Link>
  )
}

export default PricingAddons
