const withTM = require('next-transpile-modules')(['common'])

module.exports = withTM({
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
})
