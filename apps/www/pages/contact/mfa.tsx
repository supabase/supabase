import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'
import MfaContactForm from '~/components/MfaContactForm'

const meta_title = 'MFA early access | Supabase'
const meta_description = ''

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
        <h2 className="h2 block pb-16 text-center">MFA Early access</h2>

        <MfaContactForm />
      </div>
    </DefaultLayout>
  )
}

export default EnterpriseContactPage
