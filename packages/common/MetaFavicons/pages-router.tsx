import Head from 'next/head'
import { useRouter } from 'next/router'

export const DEFAULT_FAVICON_THEME_COLOR = '1E1E1E'
export const DEFAULT_FAVICON_ROUTE = '/favicon'

const MetaFaviconsPagesRouter = ({
  applicationName,
  route = DEFAULT_FAVICON_ROUTE,
  themeColor = DEFAULT_FAVICON_THEME_COLOR,
  includeRssXmlFeed = false,
  includeManifest = false,
  includeMsApplicationConfig = false,
}: {
  applicationName: string
  // alternative route to use for the favicons
  route?: string
  // theme color for the browser
  themeColor?: string
  // include RSS feed
  includeRssXmlFeed?: boolean
  // include manifest.json
  includeManifest?: boolean
  // include browserconfig.xml
  includeMsApplicationConfig?: boolean
}) => {
  const { basePath } = useRouter()

  return (
    <Head>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="57x57" href={`${basePath}${route}/apple-icon-57x57.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="60x60" href={`${basePath}${route}/apple-icon-60x60.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="72x72" href={`${basePath}${route}/apple-icon-72x72.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="76x76" href={`${basePath}${route}/apple-icon-76x76.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="114x114" href={`${basePath}${route}/apple-icon-114x114.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="120x120" href={`${basePath}${route}/apple-icon-120x120.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="144x144" href={`${basePath}${route}/apple-icon-144x144.png`}/>
      {/* prettier-ignore */}
      <link rel="apple-touch-icon-precomposed" sizes="152x152" href={`${basePath}${route}/apple-icon-152x152.png`}/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}${route}/favicon-16x16.png`} sizes="16x16"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}${route}/favicon-32x32.png`} sizes="32x32"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}${route}/favicon-48x48.png`} sizes="48x48"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}${route}/favicon-96x96.png`} sizes="96x96"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}${route}/favicon-128.png`} sizes="128x128"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}${route}/favicon-180x180.png`} sizes="180x180"/>
      {/* prettier-ignore */}
      <link rel="icon" type="image/png" href={`${basePath}${route}/favicon-196x196.png`} sizes="196x196"/>
      {/* prettier-ignore */}
      <meta name="application-name" content={applicationName ?? '&nbsp;'} />
      {/* prettier-ignore */}
      <meta name="msapplication-TileColor" content={`#${themeColor}`} />
      {/* prettier-ignore */}
      <meta name="msapplication-TileImage" content={`${basePath}${route}/mstile-144x144.png`} />
      {/* prettier-ignore */}
      <meta name="msapplication-square70x70logo" content={`${basePath}${route}/mstile-70x70.png`} />
      {/* prettier-ignore */}
      <meta name="msapplication-square150x150logo" content={`${basePath}${route}/mstile-150x150.png`} />
      {/* prettier-ignore */}
      <meta name="msapplication-wide310x150logo" content={`${basePath}${route}/mstile-310x150.png`} />
      {/* prettier-ignore */}
      <meta name="msapplication-square310x310logo" content={`${basePath}${route}/mstile-310x310.png`} />
      <meta name="theme-color" content={`#${themeColor}`} />
      <link rel="shortcut icon" href={`${basePath}${route}/favicon.ico`} />
      <link rel="icon" type="image/x-icon" href={`${basePath}${route}/favicon.ico`} />
      <link rel="apple-touch-icon" href={`${basePath}${route}/favicon.ico`} />
      {includeRssXmlFeed && (
        <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      )}
      {includeManifest && <link rel="manifest" href={`${basePath}${route}/manifest.json`} />}
      {includeMsApplicationConfig && (
        <meta name="msapplication-config" content={`${basePath}${route}/browserconfig.xml`} />
      )}
    </Head>
  )
}

export default MetaFaviconsPagesRouter
