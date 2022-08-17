import { Button } from '@supabase/ui'
import CTABanner from 'components/CTABanner/index'
import Link from 'next/link'
import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'

const DPA = () => {
  return (
    <>
      <Layout>
        <SectionContainer>
          <div className="mx-auto grid max-w-2xl grid-cols-12 rounded-lg">
            <div className="col-span-12 flex items-center lg:col-span-12">
              <div className="prose flex flex-col space-y-8 p-16">
                <h1 className="text-center text-5xl">DPA</h1>
                <p>
                  We have a long-standing commitment to customer privacy and data protection, and as
                  part of that commitment we have prepared a pre-signed Data Processing Addendum
                  ("DPA").
                </p>

                <p>You can download the latest DPA document through our security portal.</p>
                <div>
                  <Link href="https://security.supabase.com">
                    <Button size="medium" type="default">
                      Security portal
                    </Button>
                  </Link>
                </div>
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
