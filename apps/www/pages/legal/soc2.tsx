import Link from 'next/link'
import CTABanner from 'components/CTABanner/index'
import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import SOC2RequestForm from '~/components/SOC2RequestForm'

const SOC2 = () => {
  return (
    <Layout>
      <SectionContainer>
        <div className="mx-auto grid max-w-2xl grid-cols-12 rounded-lg">
          <div className="col-span-12 flex items-center lg:col-span-12">
            <div className="prose flex flex-col space-y-8 p-16">
              <h1 className="text-center text-5xl">SOC2</h1>
              <p>
                As a database company, being SOC2 compliant is important when handling sensitive
                customer data. Supabase is currently SOC2 Type 1 compliant and we're also working on
                getting certified for SOC2 Type 2 and HIPAA next.
              </p>

              <p>You can request for our latest SOC 2 document by submitting your request here.</p>

              <SOC2RequestForm />
            </div>
          </div>
        </div>
      </SectionContainer>
      <CTABanner />
    </Layout>
  )
}
export default SOC2
