const CMS_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://cms.supabase.com'
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL &&
        typeof process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL === 'string'
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL?.replace('zone-www-dot-com-git-', 'cms-git-')}`
      : 'http://localhost:3030'

// Function to generate CMS remote patterns from CMS_SITE_ORIGIN
function generateCMSRemotePatterns() {
  const patterns = []

  try {
    const cmsUrl = new URL(CMS_SITE_ORIGIN)
    const cmsHostname = cmsUrl.hostname
    const cmsProtocol = cmsUrl.protocol?.replace(':', '')

    // Validate hostname
    if (!cmsHostname) {
      console.warn('[remotePatterns] Invalid hostname extracted from CMS_SITE_ORIGIN')
      return patterns
    }

    // Add patterns for the current CMS hostname
    const pathPatterns = ['/media/**', '/api/media/**', '/api/media/file/**']

    pathPatterns.forEach((pathname) => {
      patterns.push({
        protocol: cmsProtocol,
        hostname: cmsHostname,
        pathname,
      })
    })
  } catch (error) {
    console.warn(`[remotePatterns] Failed to parse CMS_SITE_ORIGIN: "${CMS_SITE_ORIGIN}"`, error)
  }

  return patterns
}

module.exports = [
  {
    protocol: 'https',
    hostname: 'api.producthunt.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'http',
    hostname: 'localhost',
    port: '3030',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'avatars.githubusercontent.com',
    port: '',
    pathname: '/u/*',
  },
  {
    protocol: 'https',
    hostname: 'ca.slack-edge.com',
    port: '',
    pathname: '/*',
  },
  {
    protocol: 'https',
    hostname: 'colab.research.google.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'github.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 's3-us-west-2.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'img.youtube.com',
    port: '',
    pathname: '/vi/*',
  },
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    port: '',
    pathname: '/photo-*',
  },
  {
    protocol: 'https',
    hostname: 'vercel.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'obuldanrptloktxcffvn.supabase.co',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: '54321',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'xguihxuzqibwxjnimxev.supabase.co',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'pbs.twimg.com',
    port: '',
    pathname: '/profile_images/**',
  },
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'supabase.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'user-images.githubusercontent.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'media.licdn.com',
    port: '',
    pathname: '/dms/image/**',
  },
  {
    protocol: 'https',
    hostname: 'cms.supabase.com',
    port: '',
    pathname: '**',
  },
  // OG Edge Function
  {
    protocol: 'https',
    hostname: 'zhfonblqamxferhoguzj.supabase.co',
    port: '',
    pathname: '/functions/v1/generate-og',
  },
  // Dynamically generated CMS patterns based on CMS_SITE_ORIGIN
  ...generateCMSRemotePatterns(),
]
