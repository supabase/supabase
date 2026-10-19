export const genFaviconLinks = (basePath: string, route = '/favicon') => [
  {
    rel: 'icon',
    type: 'image/x-icon',
    sizes: '16x16 32x32 48x48',
    href: `${basePath.replace(/\/$/, '')}${route}/favicon.ico`,
  },
  {
    rel: 'apple-touch-icon',
    type: 'image/png',
    sizes: '180x180',
    href: `${basePath.replace(/\/$/, '')}${route}/apple-icon-180x180.png`,
  },
]
