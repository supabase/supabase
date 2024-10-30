import { type Metadata } from 'next'

const genFaviconData = (basePath: string): Metadata['icons'] => ({
  icon: {
    url: `${basePath}/favicon/favicon.ico`,
    type: 'image/x-icon',
  },
  shortcut: `${basePath}/favicon/favicon.ico`,
  apple: `${basePath}/favicon/favicon.ico`,
  other: [
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-touch-icon-57x57.png`,
      sizes: '57x57',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-touch-icon-60x60.png`,
      sizes: '60x60',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-touch-icon-72x72.png`,
      sizes: '72x72',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-touch-icon-76x76.png`,
      sizes: '76x76',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-touch-icon-114x114.png`,
      sizes: '114x114',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-touch-icon-120x120.png`,
      sizes: '120x120',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-touch-icon-144x144.png`,
      sizes: '144x144',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-touch-icon-152x152.png`,
      sizes: '152x152',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-16x16.png`,
      type: 'image/png',
      sizes: '16x16',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-32x32.png`,
      type: 'image/png',
      sizes: '32x32',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-48x48.png`,
      type: 'image/png',
      sizes: '48x48',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-96x96.png`,
      type: 'image/png',
      sizes: '96x96',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-128x128.png`,
      type: 'image/png',
      sizes: '128x128',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-180x180.png`,
      type: 'image/png',
      sizes: '180x180',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-196x196.png`,
      type: 'image/png',
      sizes: '196x196',
    },
  ],
})

export { genFaviconData }
