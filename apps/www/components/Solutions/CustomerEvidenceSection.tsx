import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import SectionContainer from 'components/Layouts/SectionContainer'

export interface CustomerEvidenceCustomer {
  name: string
  logo?: string
  highlights: string[]
  cta?: { label: string; href: string }
}

export interface CustomerEvidenceSectionProps {
  id: string
  heading: React.ReactNode
  customers: CustomerEvidenceCustomer[]
  className?: string
}

const CustomerEvidenceSection = ({
  id,
  heading,
  customers,
  className = '',
}: CustomerEvidenceSectionProps) => (
  <SectionContainer id={id} className={`py-16 md:py-24 ${className}`}>
    <div className="text-center max-w-3xl mx-auto mb-12">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl text-foreground-lighter">{heading}</h2>
    </div>
    <div className="grid md:grid-cols-2 gap-0 max-w-5xl mx-auto rounded-lg border overflow-hidden divide-x">
      {customers.map((customer) => (
        <div key={customer.name} className="p-6 md:p-8 flex flex-col">
          {customer.logo && (
            <div
              className="h-8 w-28 mb-6"
              style={{
                maskImage: `url(${customer.logo})`,
                WebkitMaskImage: `url(${customer.logo})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'left center',
                WebkitMaskPosition: 'left center',
                backgroundColor: 'currentColor',
              }}
            />
          )}
          <h3 className="text-lg text-foreground font-medium mb-4">{customer.name}</h3>
          <ul className="space-y-3 mb-6 flex-grow">
            {customer.highlights.map((highlight, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-foreground-lighter text-sm"
              >
                <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
          {customer.cta && (
            <Link
              href={customer.cta.href}
              className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-600 transition-colors"
            >
              {customer.cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ))}
    </div>
  </SectionContainer>
)

export default CustomerEvidenceSection
