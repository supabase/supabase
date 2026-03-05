import BYOCEarlyAccessForm from '~/components/Forms/BYOCEarlyAccessForm'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductHeader from '~/components/Sections/ProductHeader2'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import enterpriseContent from 'data/enterprise'
import { NextPage } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const EnterpriseQuote = dynamic(() => import('components/Sections/SingleQuote'))

const platformContent: PlatformSectionProps = {
  id: 'byoc-features',
  title: (
    <>
      Your cloud, <span className="text-foreground">operated by Supabase</span>
    </>
  ),
  subheading:
    'Deploy Supabase in your own AWS account. Keep full control of your infrastructure while Supabase handles operations.',
  features: [
    {
      id: 'data-residency',
      title: 'Data Residency & Compliance',
      icon: 'M12.5 1.5625V23.4375M12.5 1.5625C6.45939 1.5625 1.5625 6.45939 1.5625 12.5C1.5625 18.5406 6.45939 23.4375 12.5 23.4375M12.5 1.5625C18.5406 1.5625 23.4375 6.45939 23.4375 12.5C23.4375 18.5406 18.5406 23.4375 12.5 23.4375M1.82812 9.375H23.1719M1.82812 15.625H23.1719M12.5 1.5625C9.53125 4.6875 7.8125 8.46875 7.8125 12.5C7.8125 16.5312 9.53125 20.3125 12.5 23.4375M12.5 1.5625C15.4688 4.6875 17.1875 8.46875 17.1875 12.5C17.1875 16.5312 15.4688 20.3125 12.5 23.4375',
      subheading: (
        <>
          <span className="text-foreground">Your data stays in your infrastructure</span> and in
          your region. Meet strict data residency and compliance requirements with full control over
          where your data is stored.
        </>
      ),
      className: '!border-l-0 !min-h-0',
    },
    {
      id: 'custom-infrastructure',
      title: 'Custom Infrastructure',
      icon: 'M3.125 7.8125H21.875M3.125 7.8125V19.5312C3.125 20.8244 4.17562 21.875 5.46875 21.875H19.5312C20.8244 21.875 21.875 20.8244 21.875 19.5312V7.8125M3.125 7.8125V5.46875C3.125 4.17562 4.17562 3.125 5.46875 3.125H19.5312C20.8244 3.125 21.875 4.17562 21.875 5.46875V7.8125M6.25 5.46875H6.26042M8.59375 5.46875H8.60417M10.9375 5.46875H10.9479M7.8125 14.0625H17.1875M7.8125 17.1875H13.2812M7.8125 10.9375H17.1875',
      subheading: (
        <>
          <span className="text-foreground">Choose instance sizes and volumes</span> for your use
          case. No project size constraints. Deploy the exact infrastructure your workload demands.
        </>
      ),
      className: '!border-l-0 sm:!border-l !min-h-0',
    },
    {
      id: 'cloud-costs',
      title: 'Cloud Cost Optimization',
      icon: 'M12.5 1.5625V3.125M12.5 21.875V23.4375M4.6875 12.5H3.125M21.875 12.5H20.3125M12.5 7.8125C10.2513 7.8125 8.59375 9.375 8.59375 11.1328C8.59375 12.8906 10.1562 13.6719 12.5 14.4531C14.8438 15.2344 16.4062 16.0156 16.4062 17.7734C16.4062 19.5312 14.7487 21.0938 12.5 21.0938M12.5 7.8125C14.7487 7.8125 16.4062 9.08437 16.4062 10.5469M12.5 7.8125V3.90625M12.5 21.0938C10.2513 21.0938 8.59375 19.8219 8.59375 18.3594M12.5 21.0938V23.4375',
      subheading: (
        <>
          <span className="text-foreground">Apply pre-negotiated discounts and cloud credits</span>{' '}
          to your Supabase deployment. Leverage existing AWS commitments and reserved capacity
          pricing.
        </>
      ),
      className: '!border-l-0 !min-h-0',
    },
    {
      id: 'managed-operations',
      title: 'Fully Managed Operations',
      icon: 'M11.1404 7.66537C11.1404 5.18146 13.1541 3.16785 15.638 3.16785H17.3775C19.8614 3.16785 21.875 5.18146 21.875 7.66537V17.3776C21.875 19.8615 19.8614 21.8751 17.3775 21.8751H15.638C13.1541 21.8751 11.1404 19.8615 11.1404 17.3776V7.66537Z M3.125 14.7821C3.125 13.4015 4.24419 12.2823 5.62477 12.2823C7.00536 12.2823 8.12454 13.4015 8.12454 14.7821V19.3754C8.12454 20.7559 7.00536 21.8751 5.62477 21.8751C4.24419 21.8751 3.125 20.7559 3.125 19.3754V14.7821Z M3.125 5.58522C3.125 4.20463 4.24419 3.08545 5.62477 3.08545C7.00536 3.08545 8.12454 4.20463 8.12454 5.58522V6.95164C8.12454 8.33223 7.00536 9.45142 5.62477 9.45142C4.24419 9.45142 3.125 8.33223 3.125 6.95164V5.58522Z',
      subheading: (
        <>
          <span className="text-foreground">
            Supabase handles deployments, upgrades, monitoring
          </span>{' '}
          and support. No Ops overhead—focus on building while we keep everything running.
        </>
      ),
      className: '!border-l-0 sm:!border-l !min-h-0',
    },
  ],
}

const title = 'Bring Your Own Cloud (BYOC) for Supabase Early Access'
const description =
  'Deploy Supabase in your own AWS account. Meet strict data residency and compliance requirements while Supabase handles operations, upgrades and monitoring.'

const BYOCAWSPage: NextPage = () => {
  return (
    <>
      <NextSeo
        title={`${title} | Supabase`}
        description={description}
        openGraph={{
          title: `${title} | Supabase`,
          description,
          url: 'https://supabase.com/solutions/enterprise/byoc-aws',
        }}
      />
      <DefaultLayout className="!min-h-fit">
        <ProductHeader
          title="BYOC for Supabase"
          h1={
            <>
              Bring Your Own Cloud
              <span className="block">(BYOC) for Supabase</span>
            </>
          }
          subheader={[description]}
          ctas={[{ label: 'Request Early Access', href: '#early-access', type: 'primary' }]}
          className="[&_h1]:2xl:!text-5xl bg-default border-0 lg:pb-8"
          sectionContainerClassName="lg:gap-4"
        />

        <PlatformSection {...platformContent} className="[&>div:last-child]:lg:!grid-cols-2" />

        <EnterpriseQuote {...enterpriseContent.quote} />

        <SectionContainer
          id="early-access"
          className="pb-16 md:pb-24 grid gap-6 lg:gap-8 lg:grid-cols-2"
        >
          <div className="max-w-xl flex flex-col gap-2">
            <h2 className="h3 !mb-0">Early Access Request Form</h2>
            <p className="text-foreground-lighter md:text-lg">
              If you are interested in participating in BYOC early access when it becomes available
              later in 2026, please fill out the form below. A member of the Supabase team will
              reach out if you&apos;ve been selected.
            </p>
          </div>
          <BYOCEarlyAccessForm />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default BYOCAWSPage
