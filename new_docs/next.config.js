/** @type {import('next').NextConfig} */
const withMDX = require('@next/mdx')
module.exports = withMDX({
  reactStrictMode: true,
  images: {
    domains: ['github.com'],
  },
})
