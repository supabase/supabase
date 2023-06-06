import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import { GetStaticProps } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import codeHikeTheme from '~/code-hike.theme.json' assert { type: 'json' }
import components from '~/components'
import { Heading } from '~/components/CustomHTMLElements'
import Layout from '~/layouts/DefaultGuideLayout'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkComment from '~/lib/mdx/plugins/remarkComment'
import { headingDepth } from '~/lib/mdx/plugins/remarkHeadingDepth'

// We fetch these docs at build time from an external repo
const org = 'supabase-community'
const repo = 'sql-examples'
const branch = 'master'
const docsDir = 'content/sql'

/**
 * TODO: dynamically fetch these using GitHub API
 *
 * The problem with GitHub API is that it is rate-limited
 * and the limit is reached very quickly in a dev environment.
 *
 * Need to find a way to cache results in dev so that we
 * don't refetch every time.
 */
const docs = [
  'add-column.md',
  'add-constraints.md',
  'alter-column-type.md',
  'automatically-update-timestamp.md',
  'basic-aggregate-functions.md',
  'case-expression.md',
  'create-function-return-count.md',
  'create-function-return-table.md',
  'create-function.md',
  'create-table-constraints.md',
  'create-table-foreign-key.md',
  'create-table.md',
  'create-view.md',
  'cron-job.md',
  'describe-table.md',
  'drop-constraints.md',
  'drop-function.md',
  'drop-rls.md',
  'drop-trigger.md',
  'drop-view.md',
  'full-text-search.md',
  'handle-new-user.md',
  'increment-field-value.md',
  'list-all-constraint.md',
  'list-all-foreign-keys.md',
  'list-all-functions.md',
  'list-all-primary-keys.md',
  'list-all-table-size.md',
  'list-all-triggers.md',
  'query-text-from-text-array.md',
  'rename-constraints.md',
  'rls-advanced-policies.md',
  'rls-edit-policy.md',
  'rls-policies-with-joins.md',
  'rls-policies-with-security-definer-function.md',
  'rls-read-access.md',
  'rls-restrict-updates.md',
  'rls-time-to-live-for-rows.md',
  'rls-verifyng-email-domains.md',
  'seed-unlimited-users.md',
  'sequence-operations.md',
  'show-postgres-version.md',
  'stripe-subscriptions.md',
  'to-do-list.md',
  'update-constraints.md',
  'world-countries.md',
  'youtube-like-short-id.md',
]

interface DatabaseCommunityExamplesProps {
  sources: MDXRemoteSerializeResult[]
}

export default function DatabaseCommunityExamples({ sources }: DatabaseCommunityExamplesProps) {
  return (
    <Layout meta={{ title: 'SQL Examples' }}>
      {sources.map((source) => (
        <>
          <Heading tag="h2">{source.frontmatter.title}</Heading>
          <p>{source.frontmatter.description}</p>
          <MDXRemote {...source} components={components} />
        </>
      ))}
    </Layout>
  )
}

/**
 * Fetch markdown from external repo and transform links
 */
export const getStaticProps: GetStaticProps<DatabaseCommunityExamplesProps> = async () => {
  const sources: MDXRemoteSerializeResult[] = []

  for (const doc of docs) {
    const response = await fetch(
      `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${docsDir}/${doc}`
    )

    const source = await response.text()

    const codeHikeOptions: CodeHikeConfig = {
      theme: codeHikeTheme,
      lineNumbers: true,
      showCopyButton: true,
      skipLanguages: [],
      autoImport: false,
    }

    const urlTransform: UrlTransformFunction = (url) => {
      try {
        const placeholderHostname = 'placeholder'
        const { hostname, pathname } = new URL(url, `http://${placeholderHostname}`)

        // Don't modify a url with a FQDN or a url that's only a hash
        if (hostname !== placeholderHostname || pathname === '/') {
          return url
        }

        // Turn relative paths to hashes, since all docs are combined
        // into a single page
        const [, hash] = pathname.split('/')
        return `#${hash}`
      } catch (err) {
        console.error('Error transforming markdown URL', err)
        return url
      }
    }

    const mdxSource = await serialize(source, {
      parseFrontmatter: true,
      scope: {
        chCodeConfig: codeHikeOptions,
      },
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          [headingDepth, 1],
          [remarkCodeHike, codeHikeOptions],
          [remarkComment],
        ],
        rehypePlugins: [rehypeSlug, [linkTransform, urlTransform]],
      },
    })

    sources.push(mdxSource)
  }

  return { props: { sources } }
}
