import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import { FileText } from 'lucide-react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { Badge } from 'ui'

const addenda = [
  {
    label: 'Integration Partner Addendum',
    href: '/legal/partner-resources/program-addenda/integration-partner-addendum',
    effectiveDate: 'May 27, 2026',
  },
]

export default function ProgramAddendaPage() {
  return (
    <DefaultLayout>
      <NextSeo
        title="Program Addenda"
        description="Addenda to the Supabase Master Partner Program Agreement for each partner type."
      />
      <PageHeader
        breadcrumb={
          <PageBreadcrumb
            items={[
              { label: 'Legal', href: '/legal' },
              { label: 'Partner Legal Resources', href: '/legal#partner-legal-resources' },
            ]}
          />
        }
        h1="Program Addenda"
        subheader={
          <>
            Addenda to the{' '}
            <Link href="/legal/partner-resources/master-partner-program-agreement">
              Master Partner Program Agreement
            </Link>
            . Each addendum modifies and supplements the master agreement for a specific partner
            type. Partners are bound by the addendum corresponding to their participation tier.
          </>
        }
      />
      <SectionContainer className="prose">
        <h2>Current addenda</h2>
        <p>Additional partner-type addenda will be added as the program expands.</p>
        <div className="divide-y divide-border">
          {addenda.map((item) => (
            <div key={item.href} className="flex items-center gap-3 py-4">
              <FileText size={15} className="shrink-0 text-foreground-muted" />
              <Link
                href={item.href}
                className="text-foreground-light transition-colors hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
              <Badge>Effective {item.effectiveDate}</Badge>
            </div>
          ))}
        </div>
      </SectionContainer>
    </DefaultLayout>
  )
}
