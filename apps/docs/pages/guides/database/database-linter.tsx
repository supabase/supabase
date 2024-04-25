import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import { Octokit } from '@octokit/core'
import { capitalize } from 'lodash'
import { GetStaticProps, InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import { Tabs } from 'ui'

import components from '~/components'
import { Heading } from '~/components/CustomHTMLElements'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/DefaultGuideLayout'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'

// We fetch these docs at build time from an external repo
export const org = 'supabase'
export const repo = 'splinter'
export const branch = 'main'
export const docsDir = 'docs'

const meta = {
  title: 'Database Linter',
  subtitle: 'Check your database for performance and security issues',
}

const editLink = 'https://github.com/supabase/splinter/tree/main/docs'

const markdownIntro = `
You can use the Database Linter to check your database for issues such as missing indexes and improperly set-up RLS policies.

## Using the linter

In the dashboard, navigate to [Database Linter](https://supabase.com/dashboard/project/_/database/linter) under Database. The linter runs automatically. You can also manually rerun it after you've resolved issues.
`.trim()

const getBasename = (path: string) => path.split('/').at(-1).replace(/\.md$/, '')

export default function ProjectLinterDocs({
  intro,
  lints,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout menuId={MenuId.Database} meta={meta} editLink={editLink}>
      <MDXRemote {...intro} components={components} />
      <Heading tag="h2">Available lints</Heading>
      <Tabs listClassNames="flex flex-wrap gap-2 [&>button]:!m-0" queryGroup="lint">
        {lints.map((lint) => (
          <Tabs.Panel
            key={lint.path}
            id={lint.path}
            label={capitalize(getBasename(lint.path).replace(/_/g, ' '))}
          >
            <section id={getBasename(lint.path)}>
              <MDXRemote {...lint.content} components={components} />
            </section>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Layout>
  )
}

/**
 * The GitHub repo uses relative links, which don't lead to the right locations
 * in docs.
 *
 * @param url The original link, as written in the Markdown file
 * @returns The rewritten link
 */
const urlTransform: (lints: Array<{ path: string }>) => UrlTransformFunction = (lints) => (url) => {
  try {
    const placeholderHostname = 'placeholder'
    const { hostname, pathname, hash } = new URL(url, `http://${placeholderHostname}`)

    // Don't modify a url with a FQDN or a url that's only a hash
    if (hostname !== placeholderHostname || pathname === '/') {
      return url
    }

    const relativePath = getBasename(pathname)
    const section = lints.find(({ path }) => path === relativePath)

    if (section) {
      const url = new URL(window.location.href)
      url.searchParams.set('lint', relativePath)
      return url.toString()
    }

    // If we don't have this page in our docs, link to GitHub repo
    return `https://github.com/${org}/${repo}/blob/${branch}${pathname}${hash}`
  } catch (err) {
    console.error('Error transforming markdown URL', err)
    return url
  }
}

const transformMarkdown = async (
  rawContent: string,
  { replacementLinks = [] }: { replacementLinks?: Array<{ path: string }> } = {}
) => {
  const codeHikeOptions: CodeHikeConfig = {
    theme: codeHikeTheme,
    lineNumbers: true,
    showCopyButton: true,
    skipLanguages: [],
    autoImport: false,
  }

  const content = await serialize(rawContent, {
    scope: {
      chCodeConfig: codeHikeOptions,
    },
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
        remarkMkDocsAdmonition,
        remarkPyMdownTabs,
        [removeTitle, meta.title],
        [remarkCodeHike, codeHikeOptions],
      ],
      rehypePlugins: [[linkTransform, urlTransform(replacementLinks)], rehypeSlug],
    },
  })

  return content
}

/**
 * Fetch markdown from external repo and transform links
 */
export const getStaticProps = (async () => {
  const octokit = new Octokit()

  const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: org,
    repo: repo,
    path: docsDir,
    ref: branch,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (response.status >= 400) {
    throw Error(`Could not get contents of repo ${org}/${repo}`)
  }

  if (!Array.isArray(response.data)) {
    throw Error(
      `Reading a directory, not a file. Should not reach this, solely to appease Typescript.`
    )
  }

  const [intro, ...lints] = await Promise.all([
    await transformMarkdown(markdownIntro),
    ...response.data
      .filter(({ path }) => /docs\/\d+.+\.md$/.test(path))
      .map(async ({ path }, _, data) => {
        const fileResponse = await fetch(
          `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${path}`
        )

        if (fileResponse.status >= 400) {
          throw Error(`Could not get contents of file ${org}/${repo}/${path}`)
        }

        const rawContent = await fileResponse.text()
        const content = await transformMarkdown(rawContent, { replacementLinks: data })

        return {
          path: getBasename(path),
          content,
        }
      }),
  ])

  return {
    props: {
      intro,
      lints,
    },
  }
}) satisfies GetStaticProps
