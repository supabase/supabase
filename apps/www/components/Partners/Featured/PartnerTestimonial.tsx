import Image from 'next/image'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { cn } from 'ui'

interface PartnerTestimonialProps {
  quote: string
  author: string
  role: string
  company?: string
  companyLogo?: string
  variant?: 'centered' | 'left'
  className?: string
}

export function PartnerTestimonial({
  quote,
  author,
  role,
  company,
  companyLogo,
  variant = 'centered',
  className,
}: PartnerTestimonialProps) {
  if (variant === 'left') {
    return (
      <SectionContainer className={className}>
        <div className="max-w-3xl mx-auto">
          <blockquote className="text-lg text-foreground-light border-l-2 border-brand pl-6">
            "{quote}"
          </blockquote>
          <div className="mt-4 pl-6">
            <span>{author}</span>
            <span className="text-foreground-lighter text-sm ml-2">{role}</span>
          </div>
        </div>
      </SectionContainer>
    )
  }

  return (
    <SectionContainer className={cn('bg-alternative', className)}>
      <div className="max-w-3xl mx-auto text-center">
        <blockquote className="text-xl md:text-2xl text-foreground italic mb-6">
          "{quote}"
        </blockquote>
        <div className="flex flex-col items-center gap-2">
          <span>{author}</span>
          <span className="text-foreground-lighter text-sm">{role}</span>
          {companyLogo && (
            <Image
              src={companyLogo}
              alt={company || ''}
              width={100}
              height={28}
              className="mt-2 opacity-70"
            />
          )}
        </div>
      </div>
    </SectionContainer>
  )
}

