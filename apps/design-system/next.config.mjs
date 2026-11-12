import { realpathSync } from 'node:fs'
import path from 'node:path'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/design-system'

// `surfaces` imports contracts from @supabase/mcp-server-supabase, linked from a
// supabase/mcp checkout next to this repository until a release publishes
// `/apps`. Turbopack only resolves files under its root, so widen the root to
// include the link target. Remove once the dependency comes from npm.
function turbopackRoot() {
  const repoRoot = path.resolve(import.meta.dirname, '../..')
  try {
    const linked = realpathSync(
      path.join(repoRoot, 'packages/surfaces/node_modules/@supabase/mcp-server-supabase')
    )
    let root = repoRoot
    while (!linked.startsWith(root + path.sep)) root = path.dirname(root)
    return root
  } catch {
    return repoRoot
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'common', 'shared-data', 'icons', 'tsconfig', 'surfaces'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/design-system',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },
  async redirects() {
    return [
      ...(BASE_PATH.length
        ? [
            {
              source: '/',
              destination: BASE_PATH,
              basePath: false,
              permanent: false,
            },
          ]
        : []),
    ]
  },
  // Turbopack configuration to handle .md files with raw-loader
  turbopack: {
    root: turbopackRoot(),
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
