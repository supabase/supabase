import { NextSeo } from 'next-seo'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'

const meta_title = 'Enterprise Contact | Supabase'
const meta_description = 'Contact Supabase for enterprise sales and pricing.'
const enterprise_form_url = 'https://forms.supabase.com/enterprise'

const EnterpriseContactPage = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) {
      return
    }

    router.push(enterprise_form_url)
  })

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
        <p className="p mt-1.5 text-sm text-center sm:mt-5 sm:text-base lg:text-lg ">
          <a href={enterprise_form_url}>Redirecting... Click here to get redirected immediately</a>
        </p>
      </div>
    </DefaultLayout>
  )
}

export default EnterpriseContactPage
