import Head from 'next/head'
import { DESCRIPTION } from '../lib/constants'
import { useRouter } from 'next/router'

const Meta = () => {
  const { basePath } = useRouter()
  return (
    <Head>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={`${basePath}/favicon/apple-touch-icon.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`${basePath}/favicon/favicon-32x32.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`${basePath}/favicon/favicon-16x16.png`}
      />
      <link rel="manifest" href={`${basePath}/favicon/site.webmanifest`} />
      <link rel="mask-icon" href={`${basePath}/favicon/safari-pinned-tab.svg`} color="#000000" />
      <link rel="shortcut icon" href={`${basePath}/favicon/favicon.ico`} />
      <meta name="msapplication-TileColor" content="#1E1E1E" />
      <meta name="msapplication-config" content={`${basePath}/favicon/browserconfig.xml`} />
      <meta name="theme-color" content="#1E1E1E" />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />

      <meta name="description" content={DESCRIPTION} />
      <meta property="og:type" content="website" />

      <meta name="og:description" property="og:description" content={DESCRIPTION} />
      <meta property="og:site_name" content="" />
      <meta property="og:url" content={`${basePath}/public/og/og-image.jpg`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="" />
      <meta name="twitter:description" content={DESCRIPTION} />
      <meta name="twitter:creator" content="supabase_io" />
      <link rel="icon" type="image/png" href={`${basePath}/public/favicon/favicon.ico`} />
      <link rel="apple-touch-icon" href={`${basePath}/public/favicon/favicon.ico`} />
      <meta property="og:image" content={`${basePath}/public/og/og-image.jpg`} />
      <meta name="twitter:image" content={`${basePath}/public/og/og-image.jpg`} />
    </Head>
  )
}

export default Meta
