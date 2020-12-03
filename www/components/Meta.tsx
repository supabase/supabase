import Head from 'next/head'
import { DESCRIPTION, HOME_OG_IMAGE_URL } from '../lib/constants'
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
      <meta property="og:image" content={HOME_OG_IMAGE_URL} />
    </Head>
  )
}

export default Meta
