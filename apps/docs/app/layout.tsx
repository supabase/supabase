import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import { type Metadata, type Viewport } from 'next'

import { genFaviconData } from 'common/MetaFavicons/app-router'

import { GlobalProviders } from '~/features/app.providers'
import { TopNavSkeleton } from '~/layouts/MainSkeleton'
import { BASE_PATH, IS_PRODUCTION } from '~/lib/constants'

import { Inter, Roboto_Mono } from 'next/font/google'

import localFont from 'next/font/local'

// If loading a variable font, you don't need to specify the font weight
// const inter = Inter({
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-inter',
// })

// Import the Satoshi font from your local files
const inter = localFont({
  src: [
    // {
    //   path: '../public/fonts/satoshi/Satoshi-Thin.woff2',
    //   weight: '100',
    //   style: 'normal',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-ThinItalic.woff2',
    //   weight: '100',
    //   style: 'italic',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-ExtraLight.woff2',
    //   weight: '200',
    //   style: 'normal',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-ExtraLightItalic.woff2',
    //   weight: '200',
    //   style: 'italic',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-Light.woff2',
    //   weight: '300',
    //   style: 'normal',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-LightItalic.woff2',
    //   weight: '300',
    //   style: 'italic',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-Regular.woff2',
    //   weight: '400',
    //   style: 'normal',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-RegularItalic.woff2',
    //   weight: '400',
    //   style: 'italic',
    // },
    {
      path: '../public/fonts/satoshi/Satoshi-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/satoshi/Satoshi-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-SemiBold.woff2',
    //   weight: '600',
    //   style: 'normal',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-SemiBoldItalic.woff2',
    //   weight: '600',
    //   style: 'italic',
    // },
    {
      path: '../public/fonts/satoshi/Satoshi-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/satoshi/Satoshi-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-ExtraBold.woff2',
    //   weight: '800',
    //   style: 'normal',
    // },
    // {
    //   path: '../public/fonts/satoshi/Satoshi-ExtraBoldItalic.woff2',
    //   weight: '800',
    //   style: 'italic',
    // },
    {
      path: '../public/fonts/satoshi/Satoshi-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../public/fonts/satoshi/Satoshi-BlackItalic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-inter', // Optional if you want to use it as a CSS variable
})

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

const metadata: Metadata = {
  applicationName: 'Supabase Docs',
  title: 'Supabase Docs',
  description:
    'Supabase is an open source Firebase alternative providing all the backend features you need to build a product.',
  metadataBase: new URL('https://supabase.com'),
  icons: genFaviconData(BASE_PATH),
  robots: {
    index: IS_PRODUCTION,
    follow: IS_PRODUCTION,
  },
  openGraph: {
    type: 'article',
    authors: 'Supabase',
    url: `${BASE_PATH}`,
    images: `${BASE_PATH}/img/supabase-og-image.png`,
    publishedTime: new Date().toISOString(),
    modifiedTime: new Date().toISOString(),
  },
  twitter: {
    card: 'summary_large_image',
    site: '@supabase',
    creator: '@supabase',
    images: `${BASE_PATH}/img/supabase-og-image.png`,
  },
}

const viewport: Viewport = {
  themeColor: '#1E1E1E',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" className={`${inter.variable} ${roboto_mono.variable}`}>
      <body>
        <GlobalProviders>
          <TopNavSkeleton>{children}</TopNavSkeleton>
        </GlobalProviders>
      </body>
    </html>
  )
}

export { metadata, viewport }
export default RootLayout
