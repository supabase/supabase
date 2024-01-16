import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { Button, IconArrowUpRight, IconTable, cn } from 'ui'
import Link from 'next/link'

const addons = [
  {
    id: 'addon-compute',
    name: 'Scale compute up to 256GB per project',
    heroImg: 'addons-compute',
    icon: 'compute-upgrade',
    price: 'Starts from $10/month',
    description:
      'Paid plans include one Starter instance for free, additional compute add-ons are available if you need extra performance when scaling up Supabase.',
    leftCtaText: 'Compute Add-ons Documentation',
    leftCtaLink: 'https://supabase.com/docs/guides/platform/compute-add-ons',
    rightCtaText: 'See Pricing breakdown',
    rightCtaLink: '#open-modal',
  },
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
  const [isMounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div>
      <div className="text-center">
        <h2 className="text-foreground text-3xl">Customize your project</h2>
        <p className="text-foreground-light mt-4 mb-8 lg:mb-16 text-lg">
          Level up your Supabase experience with add-ons.
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
  const [isMounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isMounted) return null
  const isCompute = addon.id === 'addon-compute'

  const containerClasses = cn(
    'group relative bg-surface-100 border rounded-[4px] grid lg:grid-cols-3 gap-4 transition-colors',
    isCompute && 'lg:grid-cols-2 col-span-2',
    !isCompute && 'hover:border-stronger'
  )

  const Content = () => (
    <>
      {isCompute && (
        <button
          onClick={() => setShowComputeModal(true)}
          className="overflow-hidden rounded-lg relative lg:h-full"
        >
          <Image
            className="w-full object-cover object-top"
            fill
            quality={100}
            src={`${basePath}/images/pricing/${addon.heroImg}${
              resolvedTheme?.includes('dark') ? '' : '-light'
            }.png`}
            alt="Supabase Compute Addon"
          />
        </button>
      )}
      <div className={cn('p-8 gap-4', addon.id !== 'addon-compute' && 'col-span-2')}>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-foreground-lighter">{addon.price}</p>
          <div className="flex items-center gap-2">
            <Image
              src={`${basePath}/images/pricing/${addon.icon}${
                resolvedTheme?.includes('dark') ? '' : '-light'
              }.svg`}
              className="file:"
              width={14}
              height={14}
              alt="Compute"
            />
            <span className="text-sm text-foreground">{addon.name}</span>
          </div>
          <p className="text-foreground-lighter text-[13px]">{addon.description}</p>
        </div>
        {isCompute && (
          <div className="flex items-center gap-4 mt-4">
            <Button asChild size="tiny" type="default">
              <Link href={addon.leftCtaLink}>{addon.leftCtaText}</Link>
            </Button>
            <Button
              type="text"
              className="text-brand-600 text-[13px] leading-4"
              onClick={() => setShowComputeModal(true)}
              icon={<IconTable className="w-3 stroke-2" />}
            >
              {addon.rightCtaText}
            </Button>
          </div>
        )}
      </div>
      {!isCompute && (
        <div className="absolute right-0 lg:relative flex justify-end p-8">
          <IconArrowUpRight className="w-5 h-5 text-foreground-lighter group-hover:text-foreground transition-colors" />
        </div>
      )}
    </>
  )

  return isCompute ? (
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
