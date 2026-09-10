import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

// NOTE: this is a placeholder for our future Next.js marketing page. For now it redirects to our Next.js guide.

function Nextjs() {
  // base path for images
  const router = useRouter()
  const { basePath } = router

  useEffect(() => {
    router.push('/docs/guides/with-nextjs')
  }, [])

  const meta_title = 'Next.js Database with Auth, Realtime, Fiel Storage, and more.'
  const meta_description =
    'Supabase is the fastest way to build performant Next.js apps with Authentication & User Management, Realtime, File Storage on top of PostgreSQL Databases.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/nextjs`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/product/database/database-og.jpg`,
            },
          ],
        }}
      />
    </>
  )
}

export default Nextjs
