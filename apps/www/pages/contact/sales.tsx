import EnterpriseFormQuotes from '~/components/EnterpriseFormQuotes'
import RequestADemoForm from '~/components/Forms/RequestADemoForm'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { NextSeo } from 'next-seo'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { cn } from 'ui'

const data = {
  meta_title: 'Contact Sales & Request a Demo | Supabase',
  meta_description: 'Book a demo to explore how Supabase can support your business growth',
}

const ContactSales = () => {
  const router = useRouter()

  return (
    <>
      <NextSeo
        title={data.meta_title}
        description={data.meta_description}
        openGraph={{
          title: data.meta_title,
          description: data.meta_description,
          url: `https://supabase.com/${router.pathname}`,
        }}
      />
      {/* Default.com snippet — enriches HubSpot enterprise form submissions and routes them to instant call scheduling for Sales. */}
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(e,t){var _=0;e.__default__=e.__default__||{},e.__default__.form_id=879120,e.__default__.team_id=715,e.__default__.listenToIds=["support-form"],function e(){var o=t.createElement("script");o.async=!0,o.src="https://import-cdn.default.com",o.onload=function(){!0,console.info("[Default.com] Powered by Default.com")},o.onerror=function(){++_<=3&&setTimeout(e,1e3*_)},t.head.appendChild(o)}()}(window,document);`,
          }}
        />
      </Head>
      <DefaultLayout className="min-h-fit!">
        <SectionContainer className="text grid gap-8 lg:gap-12 md:grid-cols-2">
          <div className="md:px-4 lg:pb-8 md:h-full w-full flex flex-col justify-between gap-2">
            <div className="flex flex-col gap-2 md:max-w-md">
              <h1 className="h1 m-0!">Talk to our Sales team</h1>
              <p className="md:text-lg text-foreground-lighter">
                Book a demo and set up a trial Enterprise account to see how Supabase's scalable
                features can accelerate your business growth and app development.
              </p>
            </div>
            <EnterpriseFormQuotes
              className="hidden md:flex"
              tabs={[
                {
                  label: (
                    <CustomerLogo title="Goodtape" logo="/images/customers/logos/good-tape.png" />
                  ),
                  panel: (
                    <CustomerQuote
                      quote="My biggest regret is not having gone with Supabase from the beginning."
                      author="Jakob Steinn, Co-founder & Tech Lead, Good Tape"
                    />
                  ),
                },
                {
                  label: <CustomerLogo title="Xendit" logo="/images/customers/logos/xendit.png" />,
                  panel: (
                    <CustomerQuote
                      quote="The full solution was built and in production in less than one week."
                      author="Developer, Xendit"
                    />
                  ),
                },
                {
                  label: (
                    <CustomerLogo title="Chatbase" logo="/images/customers/logos/chatbase.png" />
                  ),
                  panel: (
                    <CustomerQuote
                      quote="Supabase is great because it has everything. I don’t need a different solution for authentication, a different solution for database, or a different solution for storage."
                      author="Yasser Elsaid, Founder, Chatbase"
                      className="max-w-none"
                    />
                  ),
                },
              ]}
            />
          </div>
          <RequestADemoForm />
          <EnterpriseFormQuotes
            className="md:hidden mt-4"
            tabs={[
              {
                label: (
                  <CustomerLogo title="Goodtape" logo="/images/customers/logos/good-tape.png" />
                ),
                panel: (
                  <CustomerQuote
                    quote="My biggest regret is not having gone with Supabase from the beginning."
                    author="Jakob Steinn Co-founder & Tech Lead"
                  />
                ),
              },
              {
                label: <CustomerLogo title="Xendit" logo="/images/customers/logos/xendit.png" />,
                panel: (
                  <CustomerQuote
                    quote="The full solution was built and in production in less than one week."
                    author="Xendit developer"
                  />
                ),
              },
              {
                label: (
                  <CustomerLogo title="Chatbase" logo="/images/customers/logos/chatbase.png" />
                ),
                panel: (
                  <CustomerQuote
                    quote="Supabase is great because it has everything. I don’t need a different solution for authentication, a different solution for database, or a different solution for storage."
                    author="Yasser Elsaid, Founder, Chatbase"
                    className="max-w-none"
                  />
                ),
              },
            ]}
          />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export const CustomerQuote = ({
  quote,
  author,
  className,
}: {
  quote: string
  author: string
  className?: string
}) => (
  <div
    className={cn('text-foreground flex text-base lg:text-lg flex-col gap-1 max-w-xs', className)}
  >
    <p>"{quote}"</p>
    <p className="text-foreground-lighter text-sm">{author}</p>
  </div>
)

export const CustomerLogo = ({ title, logo }: { title: string; logo: string }) => (
  <div className="relative h-8 max-h-5 xl:max-h-6 w-20 max-w-20 md:w-28 xl:max-w-28">
    <Image
      fill
      src={logo}
      alt={`${title} logo`}
      priority
      draggable={false}
      className="
        bg-no-repeat m-0
        object-left object-contain
        in-data-[theme*=dark]:brightness-200
        in-data-[theme*=dark]:contrast-0
        in-data-[theme*=dark]:filter
      "
    />
  </div>
)

export default ContactSales
