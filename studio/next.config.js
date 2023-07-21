module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: 'https://supabase.com/dashboard',
        permanent: true,
      },
      {
        source: '/:path*',
        destination: 'https://supabase.com/dashboard/:path*',
        permanent: true,
      },
    ]
  },
}
