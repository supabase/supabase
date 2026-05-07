import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'

type Props = {}

const ContactSection = ({
  title,
  email,
  description,
}: {
  title: string
  email: string
  description: string | React.ReactNode
}) => (
  <div className="">
    <div className="border-t-[1px] border-brand-500 w-[32px] mb-1"></div>
    <h2 className="text-xl md:text-2xl lg:text-3xl pt-1.5 lg:pt-3 tracking-[-1px] text-foreground">
      {title}
    </h2>
    <a
      href={`mailto:${email}`}
      className="inline-block mt-2 lg:mt-3 font-mono text-base lg:text-lg text-brand-link hover:underline"
    >
      {email}
    </a>
    <p className="text-foreground-light text-sm lg:text-base mt-2 lg:mt-3">{description}</p>
  </div>
)

const ContactUs = ({}: Props) => {
  const router = useRouter()

  const meta_title = 'Contact Us | Supabase'
  const meta_description =
    'Contact channels for support, legal, privacy, abuse, security, and grievance submissions'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/supabase-og.png`,
            },
          ],
        }}
      />
      <Layout>
        <div className="bg-alternative border-b border-muted">
          <SectionContainer className="flex flex-col gap-8 lg:gap-12 py-8 md:py-12 lg:py-16">
            <div className="flex flex-col gap-4 lg:max-w-2xl">
              <h1 className="text-3xl md:text-5xl xl:text-6xl tracking-[-1.1px] text-foreground">
                Contact Us
              </h1>
              <div className="text-foreground-light text-base lg:text-lg">
                <p>Need help? Want to report something? Have a legal question?</p>
                <p className="mt-2">
                  Use the right channel below so we can get you to the right team quickly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              <ContactSection
                title="Legal"
                email="legal@supabase.io"
                description="For general legal inquiries."
              />

              <ContactSection
                title="Privacy"
                email="privacy@supabase.io"
                description="For questions about personal data, data subject rights requests, GDPR/CCPA inquiries, or how Supabase processes personal information."
              />

              <ContactSection
                title="Abuse & Acceptable Use"
                email="abuse@supabase.io"
                description={
                  <>
                    To report suspected violations of our{' '}
                    <Link href="/aup" className="text-brand-link hover:underline">
                      Acceptable Use Policy
                    </Link>
                    , including spam, phishing, malware, or unlawful activity involving Supabase
                    services.
                  </>
                }
              />

              <ContactSection
                title="Security"
                email="security@supabase.io"
                description="To responsibly disclose potential security vulnerabilities or report suspected security incidents involving Supabase infrastructure or services."
              />

              <ContactSection
                title="Events"
                email="help-events@supabase.com"
                description="For hackathon or event sponsorship requests. While we can't sponsor every event, we'd love to hear about yours. We'll follow up if it's a good fit."
              />

              <div className="">
                <div className="border-t-[1px] border-brand-500 w-[32px] mb-1"></div>
                <h2 className="text-xl md:text-2xl lg:text-3xl pt-1.5 lg:pt-3 tracking-[-1px] text-foreground">
                  Grievance Officer
                </h2>
                <div className="mt-2 lg:mt-3">
                  <a
                    href="mailto:legal@supabase.io"
                    className="inline-block font-mono text-base lg:text-lg text-brand-link hover:underline"
                  >
                    legal@supabase.io
                  </a>
                  <p className="text-sm text-foreground-lighter mt-1">Attn: Tracy Lane</p>
                </div>
                <p className="text-foreground-light text-sm lg:text-base mt-2 lg:mt-3">
                  In jurisdictions that require the designation of a Grievance Officer or similar
                  compliance contact, Tracy Lane, General Counsel of Supabase, Inc., serves in that
                  role. Formal complaints, regulatory inquiries, or legally required grievance
                  submissions may be directed to the email above.
                </p>
                <p className="text-foreground-light text-sm lg:text-base mt-2">
                  Supabase will acknowledge receipt of grievances and respond within the timeframe
                  required by applicable law.
                </p>
              </div>
            </div>
          </SectionContainer>
        </div>
      </Layout>
    </>
  )
}

export default ContactUs
