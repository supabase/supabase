import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PartnerApplicationForm from '~/components/Partners/PartnerApplicationForm'

const meta_title = 'Become a Partner'
const meta_description =
  'Apply to become a Supabase integration partner and list your integration in our marketplace.'

export default function PartnerApplyPage() {
  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: 'https://supabase.com/partners/apply',
        }}
      />
      <DefaultLayout className="bg-alternative">
        <SectionContainer className="py-16 md:py-24">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="h1 mb-4">Become a Partner</h1>
              <p className="text-foreground-lighter text-lg">
                Apply to list your integration in the Supabase marketplace and grow your business.
              </p>
            </div>
            <PartnerApplicationForm />
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}
