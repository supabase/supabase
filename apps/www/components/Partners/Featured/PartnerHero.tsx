import Image from 'next/image'
import Link from 'next/link'
import { Button, cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import styles from '~/styles/animations.module.css'

interface CTA {
  label: string
  href: string
}

interface PartnerHeroProps {
  partnerName: string
  partnerLogo: string
  partnerLogoDark?: string
  headline: React.ReactNode
  subheadline: string
  ctas: CTA[]
}

export function PartnerHero({
  partnerName,
  partnerLogo,
  partnerLogoDark,
  headline,
  subheadline,
  ctas,
}: PartnerHeroProps) {
  return (
    <div className="relative w-full mx-auto pt-8 pb-0">
      <SectionContainer>
        <div className="flex flex-col text-center items-center">
          {/* Dual Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 109 113"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground"
              >
                <path
                  d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                  fill="url(#paint0_linear_partner)"
                />
                <path
                  d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                  fill="url(#paint1_linear_partner)"
                  fillOpacity="0.2"
                />
                <path
                  d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                  fill="#3ECF8E"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_partner"
                    x1="53.9738"
                    y1="54.974"
                    x2="94.1635"
                    y2="71.8295"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#249361" />
                    <stop offset="1" stopColor="#3ECF8E" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_partner"
                    x1="36.1558"
                    y1="30.578"
                    x2="54.4844"
                    y2="65.0806"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop />
                    <stop offset="1" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-foreground text-sm">Supabase</span>
            </div>
            <span className="text-foreground-muted">+</span>
            <div className="flex items-center gap-2">
              {partnerLogo && partnerLogoDark ? (
                <>
                  <Image
                    src={partnerLogoDark}
                    alt={partnerName}
                    width={24}
                    height={24}
                    className="hidden dark:block"
                  />
                  <Image
                    src={partnerLogo}
                    alt={partnerName}
                    width={24}
                    height={24}
                    className="dark:hidden"
                  />
                </>
              ) : partnerLogo ? (
                <Image src={partnerLogo} alt={partnerName} width={24} height={24} />
              ) : null}
              <span className="text-foreground text-sm">{partnerName}</span>
            </div>
          </div>

          <div
            className={cn(
              'will-change-transform flex flex-col gap-4 items-center max-w-3xl',
              styles['appear-from-bottom']
            )}
          >
            <h1 className="text-3xl md:text-5xl tracking-[-1px]">{headline}</h1>
            <p className="text-foreground-light text-lg max-w-2xl">{subheadline}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 mt-6">
            {ctas.map((cta, i) => (
              <Button key={i} asChild type={i === 0 ? 'primary' : 'default'} size="small">
                <Link href={cta.href}>{cta.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </SectionContainer>
    </div>
  )
}
