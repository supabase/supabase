import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig, type Plugin } from 'payload'
import { defaultLexical } from './fields/defaultLexical.ts'
import { getServerSideURL } from './utilities/getURL.ts'

import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import type { Customer, Event, Post } from './payload-types'

import { Authors } from './collections/Authors.ts'
import { Categories } from './collections/Categories.ts'
import { Customers } from './collections/Customers/index.ts'
import { Events } from './collections/Events/index.ts'
import { Media } from './collections/Media.ts'
import { Posts } from './collections/Posts/index.ts'
import { Tags } from './collections/Tags.ts'
import { Users } from './collections/Users.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const siteName = 'Supabase'

const generateTitle: GenerateTitle<Post & Customer & Event> = ({ doc, collectionSlug }: any) => {
  switch (collectionSlug) {
    case 'customers':
      return `${doc.name} | ${siteName} Customer Stories`
    case 'events':
      return `${doc.title} | ${siteName} Events`
    case 'posts':
      return doc.title
    default:
      return `${doc.title} | ${siteName}`
  }
}

const generateURL: GenerateURL<Post> = ({ doc }: any) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const plugins: Plugin[] = [
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  payloadCloudPlugin(),
  s3Storage({
    collections: {
      media: {
        prefix: 'media',
      },
    },
    bucket: process.env.S3_BUCKET || '',
    config: {
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
    },
  }),
]

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  collections: [Authors, Categories, Customers, Events, Media, Posts, Tags, Users],
  editor: defaultLexical,
  secret: process.env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  cors: [getServerSideURL()].filter(Boolean),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // schemaName: 'cms-payload',
  }),
  sharp,
  plugins,
})
