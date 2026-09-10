import Head from 'next/head'
import { useRouter } from 'next/router'

function FaviconImports() {
  const { basePath } = useRouter()

  return (
    <Head>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <link
        rel="apple-touch-icon"
        sizes="57x57"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-57x57.png`}
      />
      <link
        rel="apple-touch-icon"
        sizes="60x60"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-60x60.png`}
      />
      <link
        rel="apple-touch-icon"
        sizes="72x72"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-72x72.png`}
      />
      <link
        rel="apple-touch-icon"
        sizes="76x76"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-76x76.png`}
      />
      <link
        rel="apple-touch-icon"
        sizes="114x114"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-114x114.png`}
      />
      <link
        rel="apple-touch-icon"
        sizes="120x120"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-120x120.png`}
      />
      <link
        rel="apple-touch-icon"
        sizes="144x144"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-144x144.png`}
      />
      <link
        rel="apple-touch-icon"
        sizes="152x152"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-152x152.png`}
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={`${basePath}/images/launchweek/lwx/favicon/apple-icon-180x180.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href={`${basePath}/images/launchweek/lwx/favicon/android-icon-192x192.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`${basePath}/images/launchweek/lwx/favicon/favicon-32x32.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="96x96"
        href={`${basePath}/images/launchweek/lwx/favicon/favicon-96x96.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`${basePath}/images/launchweek/lwx/favicon/favicon-16x16.png`}
      />
      <link rel="manifest" href={`${basePath}/images/launchweek/lwx/favicon/manifest.json" /`} />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta
        name="msapplication-TileImage"
        content="/images/launchweek/lwx/favicon/ms-icon-144x144.png"
      />
      <meta name="theme-color" content="#ffffff" />
    </Head>
  )
}

export default FaviconImports
