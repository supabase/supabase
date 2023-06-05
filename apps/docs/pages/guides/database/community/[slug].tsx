import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { relative } from 'path'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import codeHikeTheme from '~/code-hike.theme.json' assert { type: 'json' }
import components from '~/components'
import Layout from '~/layouts/DefaultGuideLayout'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'

// We fetch these docs at build time from an external repo
const org = 'supabase-community'
const repo = 'sql-examples'
const branch = 'master'
const docsDir = 'content/sql'
const externalSite = 'https://sql-examples.vercel.app'

// Each external docs page is mapped to a local page
const pageMap = [
  { slug: 'add-column', meta: { title: 'Add column' }, remoteFile: 'add-column.md' },
  { slug: 'add-constraints', meta: { title: 'Add constraints' }, remoteFile: 'add-constraints.md' },
  {
    slug: 'alter-column-type',
    meta: { title: 'Alter column type' },
    remoteFile: 'alter-column-type.md',
  },
  {
    slug: 'automatically-update-timestamp',
    meta: { title: 'Automatically update timestamp' },
    remoteFile: 'automatically-update-timestamp.md',
  },
  {
    slug: 'basic-aggregate-functions',
    meta: { title: 'Basic aggregate functions' },
    remoteFile: 'basic-aggregate-functions.md',
  },
  { slug: 'case-expression', meta: { title: 'Case expression' }, remoteFile: 'case-expression.md' },
  {
    slug: 'create-function-return-count',
    meta: { title: 'Create function return count' },
    remoteFile: 'create-function-return-count.md',
  },
  {
    slug: 'create-function-return-table',
    meta: { title: 'Create function return table' },
    remoteFile: 'create-function-return-table.md',
  },
  { slug: 'create-function', meta: { title: 'Create function' }, remoteFile: 'create-function.md' },
  {
    slug: 'create-table-constraints',
    meta: { title: 'Create table constraints' },
    remoteFile: 'create-table-constraints.md',
  },
  {
    slug: 'create-table-foreign-key',
    meta: { title: 'Create table foreign key' },
    remoteFile: 'create-table-foreign-key.md',
  },
  { slug: 'create-table', meta: { title: 'Create table' }, remoteFile: 'create-table.md' },
  { slug: 'create-view', meta: { title: 'Create view' }, remoteFile: 'create-view.md' },
  { slug: 'cron-job', meta: { title: 'Cron job' }, remoteFile: 'cron-job.md' },
  { slug: 'describe-table', meta: { title: 'Describe table' }, remoteFile: 'describe-table.md' },
  {
    slug: 'drop-constraints',
    meta: { title: 'Drop constraints' },
    remoteFile: 'drop-constraints.md',
  },
  { slug: 'drop-function', meta: { title: 'Drop function' }, remoteFile: 'drop-function.md' },
  { slug: 'drop-rls', meta: { title: 'Drop RLS' }, remoteFile: 'drop-rls.md' },
  { slug: 'drop-trigger', meta: { title: 'Drop trigger' }, remoteFile: 'drop-trigger.md' },
  { slug: 'drop-view', meta: { title: 'Drop view' }, remoteFile: 'drop-view.md' },
  {
    slug: 'full-text-search',
    meta: { title: 'Full text search' },
    remoteFile: 'full-text-search.md',
  },
  { slug: 'handle-new-user', meta: { title: 'Handle new user' }, remoteFile: 'handle-new-user.md' },
  {
    slug: 'increment-field-value',
    meta: { title: 'Increment field value' },
    remoteFile: 'increment-field-value.md',
  },
  {
    slug: 'list-all-constraint',
    meta: { title: 'List all constraint' },
    remoteFile: 'list-all-constraint.md',
  },
  {
    slug: 'list-all-foreign-keys',
    meta: { title: 'List all foreign keys' },
    remoteFile: 'list-all-foreign-keys.md',
  },
  {
    slug: 'list-all-functions',
    meta: { title: 'List all functions' },
    remoteFile: 'list-all-functions.md',
  },
  {
    slug: 'list-all-primary-keys',
    meta: { title: 'List all primary keys' },
    remoteFile: 'list-all-primary-keys.md',
  },
  {
    slug: 'list-all-table-size',
    meta: { title: 'List all table size' },
    remoteFile: 'list-all-table-size.md',
  },
  {
    slug: 'list-all-triggers',
    meta: { title: 'List all triggers' },
    remoteFile: 'list-all-triggers.md',
  },
  {
    slug: 'query-text-from-text-array',
    meta: { title: 'Query text from text array' },
    remoteFile: 'query-text-from-text-array.md',
  },
  {
    slug: 'rename-constraints',
    meta: { title: 'Rename constraints' },
    remoteFile: 'rename-constraints.md',
  },
  {
    slug: 'rls-advanced-policies',
    meta: { title: 'RLS advanced policies' },
    remoteFile: 'rls-advanced-policies.md',
  },
  { slug: 'rls-edit-policy', meta: { title: 'RLS edit policy' }, remoteFile: 'rls-edit-policy.md' },
  {
    slug: 'rls-policies-with-joins',
    meta: { title: 'RLS policies with joins' },
    remoteFile: 'rls-policies-with-joins.md',
  },
  {
    slug: 'rls-policies-with-security-definer-function',
    meta: { title: 'RLS policies with security definer function' },
    remoteFile: 'rls-policies-with-security-definer-function.md',
  },
  { slug: 'rls-read-access', meta: { title: 'RLS read access' }, remoteFile: 'rls-read-access.md' },
  {
    slug: 'rls-restrict-updates',
    meta: { title: 'RLS restrict updates' },
    remoteFile: 'rls-restrict-updates.md',
  },
  {
    slug: 'rls-time-to-live-for-rows',
    meta: { title: 'RLS time to live for rows' },
    remoteFile: 'rls-time-to-live-for-rows.md',
  },
  {
    slug: 'rls-verifyng-email-domains',
    meta: { title: 'RLS verifying email domains' },
    remoteFile: 'rls-verifyng-email-domains.md',
  },
  {
    slug: 'seed-unlimited-users',
    meta: { title: 'Seed unlimited users' },
    remoteFile: 'seed-unlimited-users.md',
  },
  {
    slug: 'sequence-operations',
    meta: { title: 'Sequence operations' },
    remoteFile: 'sequence-operations.md',
  },
  {
    slug: 'show-postgres-version',
    meta: { title: 'Show Postgres version' },
    remoteFile: 'show-postgres-version.md',
  },
  {
    slug: 'stripe-subscriptions',
    meta: { title: 'Stripe subscriptions' },
    remoteFile: 'stripe-subscriptions.md',
  },
  { slug: 'to-do-list', meta: { title: 'To do list' }, remoteFile: 'to-do-list.md' },
  {
    slug: 'update-constraints',
    meta: { title: 'Update constraints' },
    remoteFile: 'update-constraints.md',
  },
  { slug: 'world-countries', meta: { title: 'World countries' }, remoteFile: 'world-countries.md' },
  {
    slug: 'youtube-like-short-id',
    meta: { title: 'YouTube-like short ID' },
    remoteFile: 'youtube-like-short-id.md',
  },
]

interface DatabaseCommunityExamplesProps {
  source: MDXRemoteSerializeResult
  meta: {
    title: string
    description?: string
  }
}

export default function DatabaseCommunityExamples({
  source,
  meta,
}: DatabaseCommunityExamplesProps) {
  return (
    <Layout meta={meta}>
      <MDXRemote {...source} components={components} />
    </Layout>
  )
}

/**
 * Fetch markdown from external repo and transform links
 */
export const getStaticProps: GetStaticProps<DatabaseCommunityExamplesProps> = async ({
  params,
}) => {
  const page = pageMap.find(({ slug }) => slug === params.slug)

  if (!page) {
    throw new Error(`No page mapping found for slug '${params.slug}'`)
  }

  const { remoteFile, meta } = page

  const response = await fetch(
    `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${docsDir}/${remoteFile}`
  )

  const source = await response.text()

  const urlTransform: UrlTransformFunction = (url) => {
    try {
      const externalSiteUrl = new URL(externalSite)

      const placeholderHostname = 'placeholder'
      const { hostname, pathname, hash } = new URL(url, `http://${placeholderHostname}`)

      // Don't modify a url with a FQDN or a url that's only a hash
      if (hostname !== placeholderHostname || pathname === '/') {
        return url
      }

      const relativePage = (
        pathname.endsWith('.md')
          ? pathname.replace(/\.md$/, '')
          : relative(externalSiteUrl.pathname, pathname)
      ).replace(/^\//, '')

      const page = pageMap.find(({ remoteFile }) => `${relativePage}.md` === remoteFile)

      // If we have a mapping for this page, use the mapped path
      if (page) {
        return page.slug + hash
      }

      // If we don't have this page in our docs, link to original docs
      return `${externalSite}/${relativePage}${hash}`
    } catch (err) {
      console.error('Error transforming markdown URL', err)
      return url
    }
  }

  const codeHikeOptions: CodeHikeConfig = {
    theme: codeHikeTheme,
    lineNumbers: true,
    showCopyButton: true,
    skipLanguages: [],
    autoImport: false,
  }

  const mdxSource = await serialize(source, {
    scope: {
      chCodeConfig: codeHikeOptions,
    },
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
        remarkMkDocsAdmonition,
        [removeTitle, meta.title],
        [remarkCodeHike, codeHikeOptions],
      ],
      rehypePlugins: [[linkTransform, urlTransform], rehypeSlug],
    },
  })

  return { props: { source: mdxSource, meta } }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: pageMap.map(({ slug }) => ({
      params: {
        slug,
      },
    })),
    fallback: false,
  }
}
