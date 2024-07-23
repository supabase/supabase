// @ts-check
import { remarkCodeHike } from '@code-hike/mdx'
import nextMdx from '@next/mdx'
import os from 'node:os'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import configureBundleAnalyzer from '@next/bundle-analyzer'
import withYaml from 'next-plugin-yaml'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

const withBundleAnalyzer = configureBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      [
        remarkCodeHike,
        {
          theme: codeHikeTheme,
          lineNumbers: true,
          showCopyButton: true,
        },
      ],
      remarkGfm,
    ],
    rehypePlugins: [rehypeSlug],
    providerImportSource: '@mdx-js/react',
  },
})

/** @type {import('next').NextConfig} nextConfig */

const nextConfig = {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // reactStrictMode: true,
  // swcMinify: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/docs',
  images: {
    dangerouslyAllowSVG: true,
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'supabase.github.io',
      'user-images.githubusercontent.com',
      'raw.githubusercontent.com',
      'weweb-changelog.ghost.io',
      'img.youtube.com',
      'archbee-image-uploads.s3.amazonaws.com',
      'obuldanrptloktxcffvn.supabase.co',
      'xguihxuzqibwxjnimxev.supabase.co',
    ],
  },
  // TODO: @next/mdx ^13.0.2 only supports experimental mdxRs flag. next ^13.0.2 will stop warning about this being unsupported.
  // mdxRs: true,
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  transpilePackages: ['ui', 'ui-patterns', 'common', 'dayjs', 'shared-data', 'api-types', 'icons'],
  staticPageGenerationTimeout: 300,
  /**
   * The SQL to REST API translator relies on libpg-query, which packages a
   * native Node.js module that wraps the Postgres query parser.
   *
   * The default webpack config can't load native modules, so we need a custom
   * loader for it, which calls process.dlopen to load C++ Addons.
   *
   * See https://github.com/eisberg-labs/nextjs-node-loader
   */
  webpack: (config) => {
    config.module.rules.push({
      test: /\.node$/,
      use: [
        {
          loader: 'nextjs-node-loader',
          options: {
            flags: os.constants.dlopen.RTLD_NOW,
            outputPath: config.output.path,
          },
        },
      ],
    })
    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: '',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },

  /**
   * Doc rewrites and redirects are
   * handled by the `www` nextjs config:
   *
   * ./apps/www/lib/redirects.js
   *
   * Only add dev/preview specific redirects
   * in this config.
   */
  async redirects() {
    return [
      // Redirect root to docs base path in dev/preview envs
      {
        source: '/',
        destination: '/docs',
        basePath: false,
        permanent: false,
      },

      // Redirect dashboard links in dev/preview envs
      {
        source: '/dashboard/:path*',
        destination: 'https://supabase.com/dashboard/:path*',
        basePath: false,
        permanent: false,
      },

      // Redirect blog links in dev/preview envs
      {
        source: '/blog/:path*',
        destination: 'https://supabase.com/blog/:path*',
        basePath: false,
        permanent: false,
      },
    ]
  },
  typescript: {
    // WARNING: production builds can successfully complete even there are type errors
    // Typechecking is checked separately via .github/workflows/typecheck.yml
    ignoreBuildErrors: true,
  },
  eslint: {
    // We are already running linting via GH action, this will skip linting during production build on Vercel
    ignoreDuringBuilds: true,
  },
}

const configExport = () => {
  const plugins = [withMDX, withYaml, withBundleAnalyzer]
  // @ts-ignore
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}

export default configExport
