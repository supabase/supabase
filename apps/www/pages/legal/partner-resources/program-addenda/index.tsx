import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import { getAddendaList, type AddendumSummary } from '~/lib/addenda'
import { FileText } from 'lucide-react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { Badge } from 'ui'

export async function getStaticProps() {
  return { props: { addenda: getAddendaList() } }
}

export default function ProgramAddendaPage({ addenda }: { addenda: AddendumSummary[] }) {
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
            <div key={item.slug} className="flex items-center gap-3 py-4">
              <FileText size={15} className="shrink-0 text-foreground-muted" />
              <Link
                href={item.href}
                className="text-foreground-light transition-colors hover:text-foreground hover:underline"
              >
                {item.title}
              </Link>
              <Badge>Effective {item.versions[0].effectiveDate}</Badge>
            </div>
          ))}
        </div>
      </SectionContainer>
    </DefaultLayout>
  )
}
