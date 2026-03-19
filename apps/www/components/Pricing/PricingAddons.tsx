'use client'

import { ArrowUpRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'
import { Button, cn } from 'ui'
import CostControlAnimation from './CostControlAnimation'

const addons = [
  {
    id: 'addon-cost-control',
    name: 'Cost Control',
    price: 'Available on Pro Plan',
    heroImg: <CostControlAnimation className="relative w-full h-full lg:max-w-md" />,
    description:
      "The Pro Plan has a spend cap enabled by default to keep costs under control. If you want to scale beyond the plan's included quota, simply switch off the spend cap to pay for additional resources.",
    ctaText: 'Learn about Cost Control',
    ctaLink: 'https://supabase.com/docs/guides/platform/cost-control#spend-cap',
    ctaTarget: '_blank',
  },
  {
    id: 'addon-custom-domain',
    name: 'Custom Domain',
    heroImg: 'custom-domain-on',
    icon: 'custom-domain-upgrade',
    price: 'Flat fee $10/month',
    description:
      'Use your own domain for your Supabase project to present a branded experience to your users.',
    ctaText: 'Documentation',
    ctaLink: 'https://supabase.com/docs/guides/platform/custom-domains',
    ctaTarget: '_blank',
  },
  {
    id: 'addon-pitr',
    name: 'Point in Time Recovery',
    heroImg: 'pitr-on',
    icon: 'pitr-upgrade',
    price: 'Starts from $100/month',
    description: 'Roll back to any specific point in time, down to the second.',
    ctaText: 'Documentation',
    ctaLink: 'https://supabase.com/docs/guides/platform/backups',
    ctaTarget: '_blank',
  },
]

const PricingAddons: FC = () => {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-foreground text-3xl">Fine-tune your project</h2>
        <p className="text-foreground-light mt-4 mb-8 lg:mb-16 text-lg">
          Go beyond your Plan limits and level up your Supabase experience
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-16 mx-auto max-w-6xl">
        {addons.map((addon) => (
          <AddonCard key={addon.name} addon={addon} />
        ))}
      </div>
    </div>
  )
}

const AddonCard = ({ addon }: any) => {
  const { resolvedTheme } = useTheme()
  const basePath = '' // basePath is empty string in next.config.mjs

  const isHighlightCard = addon.id === 'addon-cost-control'

  const containerClasses = cn(
    'group relative bg-surface-100 border rounded-lg gap-4 transition-colors',
    isHighlightCard && 'flex flex-col lg:flex-row lg:h-[300px] col-span-2',
    !isHighlightCard &&
      'flex flex-col lg:flex-row hover:border-stronger hover:bg-surface-200 col-span-2 sm:col-span-1'
  )

  const HighlightCard = () => (
    <>
      <div className="relative order-last lg:order-first w-full max-w-full lg:w-auto lg:h-full aspect-[2/1] lg:aspect-[3/2] p-4 pt-0 lg:pt-4 lg:pr-0">
        {addon.heroImg}
      </div>

      <div className="p-4 gap-4 flex flex-col justify-center">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-foreground-lighter" translate="no">
            {addon.price}
          </p>
          <div className="flex items-center gap-2">
            <h3 className="text-foreground text-2xl">{addon.name}</h3>
          </div>
          <p className="text-foreground-lighter text-[13px] text-base xl:pr-8">
            {addon.description}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <Button
            asChild
            size="tiny"
            type="default"
            iconRight={<ArrowUpRight className="w-4 h-4" />}
          >
            <Link href={addon.ctaLink} target={addon.ctaTarget}>
              {addon.ctaText}
            </Link>
          </Button>
        </div>
      </div>
    </>
  )

  const SmallCard = () => (
    <>
      <div
        className={cn(
          'relative w-full hidden lg:block md:aspect-[1.53/1] md:h-auto max-w-[200px]',
          addon.id === 'addon-pitr' && 'lg:flex items-end'
        )}
      >
        <Image
          src={`${basePath}/images/pricing/${addon.heroImg}${
            resolvedTheme?.includes('dark') ? '' : '-light'
          }.svg`}
          alt={`${addon.name} illustration`}
          fill
          className={cn('object-contain', addon.id === 'addon-pitr' && 'object-bottom')}
        />
      </div>
      <div className="p-4 lg:pl-0 lg:-ml-2 xl:ml-0 gap-4 col-span-2">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-foreground-lighter" translate="no">
            {addon.price}
          </p>
          <div className="flex items-center gap-2">
            <Image
              src={`${basePath}/images/pricing/${addon.icon}${
                resolvedTheme?.includes('dark') ? '' : '-light'
              }.svg`}
              width={14}
              height={14}
              alt="Compute"
            />
            <h3 className="text-sm text-foreground">{addon.name}</h3>
          </div>
          <p className="text-foreground-lighter text-[13px]">{addon.description}</p>
        </div>
      </div>
      <div className="absolute right-0 flex justify-end p-4">
        <ArrowUpRight className="w-5 h-5 text-foreground-lighter group-hover:text-foreground transition-colors" />
      </div>
    </>
  )

  return isHighlightCard ? (
    <div className={containerClasses}>
      <HighlightCard />
    </div>
  ) : (
    <Link href={addon.ctaLink} className={containerClasses} target={addon.ctaTarget}>
      <SmallCard />
    </Link>
  )
}

export default PricingAddons
