import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import EnterpriseContactForm from '~/components/EnterpriseContactForm'
import DefaultLayout from '~/components/Layouts/Default'

const meta_title = 'Enterprise Contact | Supabase'
const meta_description = 'Contact Supabase for enterprise sales and pricing.'

const EnterpriseContactPage = () => {
  const router = useRouter()

  return (
    <DefaultLayout>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/og-image.jpg`,
            },
          ],
        }}
      />

      <div className="mx-auto my-16 max-w-xl px-4 md:my-20 lg:my-24 xl:my-32">
        <h2 className="h2 block pb-16 text-center">Contact Enterprise Sales</h2>

        <EnterpriseContactForm />
      </div>
    </DefaultLayout>
  )
}

export default EnterpriseContactPage
