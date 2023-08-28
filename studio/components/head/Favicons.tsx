import Head from 'next/head'
import { useRouter } from 'next/router'

const Favicons = () => {
  const { basePath } = useRouter()
  return (
    <Head>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="57x57" href={`${basePath}/favicon/apple-touch-icon-57x57.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="114x114" href={`${basePath}/favicon/apple-touch-icon-114x114.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="72x72" href={`${basePath}/favicon/apple-touch-icon-72x72.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="144x144" href={`${basePath}/favicon/apple-touch-icon-144x144.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="60x60" href={`${basePath}/favicon/apple-touch-icon-60x60.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="120x120" href={`${basePath}/favicon/apple-touch-icon-120x120.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="76x76" href={`${basePath}/favicon/apple-touch-icon-76x76.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="152x152" href={`${basePath}/favicon/apple-touch-icon-152x152.png`}/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}/favicon/favicon-196x196.png`} sizes="196x196"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}/favicon/favicon-96x96.png`} sizes="96x96"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}/favicon/favicon-32x32.png`} sizes="32x32"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}/favicon/favicon-16x16.png`} sizes="16x16"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}/favicon/favicon-128.png`} sizes="128x128"/>
      <meta name="application-name" content="&nbsp;" />
      <meta name="msapplication-TileColor" content="#1E1E1E" />
      <meta name="msapplication-TileImage" content="mstile-144x144.png" />
      <meta name="msapplication-square70x70logo" content="mstile-70x70.png" />
      <meta name="msapplication-square150x150logo" content="mstile-150x150.png" />
      <meta name="msapplication-wide310x150logo" content="mstile-310x150.png" />
      <meta name="msapplication-square310x310logo" content="mstile-310x310.png" />
      <meta name="theme-color" content="#1E1E1E" />
      <link rel="shortcut icon" href={`${basePath}/favicon/favicon.ico`} />
      <link rel="icon" type="image/png" href={`${basePath}/favicon/favicon.ico`} />
      {/* misc */}
      <link
        rel="manifest"
        href={`${basePath}/favicon/site.webmanifest`}
        crossOrigin="use-credentials"
      />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      <link rel="apple-touch-icon" href={`${basePath}/favicon/favicon.ico`} />
      <meta name="msapplication-config" content={`${basePath}/favicon/browserconfig.xml`} />
    </Head>
  )
}

export default Favicons
