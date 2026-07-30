import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import CTABanner from 'components/CTABanner/index'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Data Processing Addendum',
  description: 'Supabase Data Processing Addendum',
}

const DPA = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <PageHeader
        breadcrumb={
          <PageBreadcrumb
            items={[
              { label: 'Legal', href: '/legal' },
              { label: 'Customer Legal Resources', href: '/legal#customer-legal-resources' },
            ]}
          />
        }
        h1="Data Processing Addendum"
      />
      <SectionContainer className="prose">
        <p>
          We have a long-standing commitment to customer privacy and data protection. As part of
          this commitment, we have prepared a Data Processing Addendum ("DPA"). You can review a
          static PDF version of our latest DPA document{' '}
          <a
            href="https://supabase.com/downloads/docs/Supabase+DPA+260601.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
            onClick={() =>
              sendTelemetryEvent({
                action: 'dpa_pdf_opened',
                properties: { source: 'www' },
              })
            }
          >
            here
          </a>
          .
        </p>

        <p>
          To make the DPA legally binding, you need to sign and complete the details through a
          PandaDoc document that we prepare. To get this version of the DPA,{' '}
          <a
            href="https://supabase.com/dashboard/org/_/documents"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            request it from the legal documents page
          </a>{' '}
          of your Supabase dashboard.
        </p>
      </SectionContainer>
      <CTABanner />
    </DefaultLayout>
  )
}
export default DPA
