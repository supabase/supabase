import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'

function RefSEO({ title }) {
  const router = useRouter()

  const path = router.asPath.replace('crawlers/', '')

  return (
    <NextSeo
      title={title}
      openGraph={{
        title,
        url: `https://iechor.com/docs${path}`,
        images: [
          {
            url: `https://iechor.com/docs/img/supabase-og-image.png`,
          },
        ],
      }}
    />
  )
}

export default RefSEO
