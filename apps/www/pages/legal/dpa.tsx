import CTABanner from 'components/CTABanner/index'
import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { useSendTelemetryEvent } from '~/lib/telemetry'

const DPA = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <>
      <Layout>
        <SectionContainer>
          <div className="mx-auto grid max-w-2xl grid-cols-12 rounded-lg">
            <div className="col-span-12 flex items-center lg:col-span-12">
              <div className="prose flex flex-col space-y-8 pb-16">
                <h1 className="text-center text-5xl">DPA</h1>
                <p>
                  We have a long-standing commitment to customer privacy and data protection. As
                  part of this commitment, we have prepared a Data Processing Addendum ("DPA"). You
                  can review a static PDF version of our latest DPA document{' '}
                  <a
                    href="https://supabase.com/downloads/docs/Supabase+DPA+250805.pdf"
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
                  To make the DPA legally binding, you need to sign and complete the details through
                  a PandaDoc document that we prepare. To get this version of the DPA,{' '}
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
              </div>
            </div>
          </div>
        </SectionContainer>
        <CTABanner />
      </Layout>
    </>
  )
}
export default DPA
