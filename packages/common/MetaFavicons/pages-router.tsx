'use client'

import Head from 'next/head'
import { useRouter } from 'next/router'

import { genFaviconLinks } from './icons'

export const DEFAULT_FAVICON_THEME_COLOR = '1E1E1E'
export const DEFAULT_FAVICON_ROUTE = '/favicon'

const MetaFaviconsPagesRouter = ({
  applicationName,
  route = DEFAULT_FAVICON_ROUTE,
  themeColor = DEFAULT_FAVICON_THEME_COLOR,
  includeRssXmlFeed = false,
  includeManifest = false,
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
}) => {
  const { basePath } = useRouter()

  return (
    <Head>
      <meta name="application-name" content={applicationName} />
      <meta name="theme-color" content={`#${themeColor}`} />
      {genFaviconLinks(basePath, route).map((link) => (
        <link key={link.rel} {...link} />
      ))}
      {includeRssXmlFeed && (
        <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      )}
      {includeManifest && <link rel="manifest" href={`${basePath}${route}/manifest.json`} />}
    </Head>
  )
}

export default MetaFaviconsPagesRouter
