import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

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
    <SectionContainer className="pt-16 pb-12">
      <div className="flex flex-col items-center text-center gap-8">
        {/* Dual Logo */}
        <div className="flex items-center gap-6">
          <Image
            src="/images/supabase-logo-wordmark--dark.png"
            alt="Supabase"
            width={140}
            height={32}
            className="hidden dark:block"
          />
          <Image
            src="/images/supabase-logo-wordmark--light.png"
            alt="Supabase"
            width={140}
            height={32}
            className="dark:hidden"
          />
          <span className="text-3xl text-foreground-muted font-light">+</span>
          {partnerLogoDark ? (
            <>
              <Image
                src={partnerLogoDark}
                alt={partnerName}
                width={140}
                height={32}
                className="hidden dark:block"
              />
              <Image
                src={partnerLogo}
                alt={partnerName}
                width={140}
                height={32}
                className="dark:hidden"
              />
            </>
          ) : (
            <Image src={partnerLogo} alt={partnerName} width={140} height={32} />
          )}
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight max-w-3xl">{headline}</h1>

        <p className="text-xl text-foreground-lighter max-w-2xl">{subheadline}</p>

        <div className="flex flex-wrap gap-4 justify-center">
          {ctas.map((cta, i) => (
            <Button key={i} asChild type={i === 0 ? 'primary' : 'default'} size="medium">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}

