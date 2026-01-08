import Image from 'next/image'
import Link from 'next/link'
import { Button, cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import styles from '~/styles/animations.module.css'
import { IsometricGrid } from './IsometricGrid'

import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'

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
    <div className="relative w-full mx-auto pt-16 pb-8 lg:pb-24 overflow-hidden border-b border-b-muted">
      <IsometricGrid />
      <SectionContainer className="relative z-10">
        <div className="flex flex-col text-center items-center">
          {/* Dual Logo */}
          <div className="flex items-center gap-8 mb-10">
            <Image
              src={supabaseLogoWordmarkDark}
              alt="Supabase"
              width={200}
              height={45}
              className="hidden dark:block h-10 w-auto"
            />
            <Image
              src={supabaseLogoWordmarkLight}
              alt="Supabase"
              width={200}
              height={45}
              className="dark:hidden h-10 w-auto"
            />

            <span className="text-3xl text-foreground-muted">+</span>

            {partnerLogo && (
              <>
                {partnerLogoDark ? (
                  <>
                    <Image
                      src={partnerLogoDark}
                      alt={partnerName}
                      width={160}
                      height={50}
                      className="hidden dark:block h-10 w-auto"
                    />
                    <Image
                      src={partnerLogo}
                      alt={partnerName}
                      width={160}
                      height={50}
                      className="dark:hidden h-10 w-auto"
                    />
                  </>
                ) : (
                  <Image
                    src={partnerLogo}
                    alt={partnerName}
                    width={160}
                    height={50}
                    className="h-10 w-auto"
                  />
                )}
              </>
            )}
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
