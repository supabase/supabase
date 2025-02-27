import { Octokit } from '@octokit/core'
import { capitalize } from 'lodash'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import rehypeSlug from 'rehype-slug'

import { Heading } from 'ui'

import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { fetchRevalidatePerDay } from '~/features/helpers.fetch'
import { Tabs, TabPanel } from '~/features/ui/Tabs'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'

// We fetch these docs at build time from an external repo
const org = 'supabase'
const repo = 'splinter'
const branch = 'main'
const docsDir = 'docs'

const meta = {
  title: 'Performance and Security Advisors',
  subtitle: 'Check your database for performance and security issues',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/database/database-linter',
  meta,
}))

const editLink = newEditLink('supabase/splinter/tree/main/docs')

const markdownIntro = `
You can use the Database Performance and Security Advisors to check your database for issues such as missing indexes and improperly set-up RLS policies.

## Using the Advisors

In the dashboard, navigate to [Security Advisor](https://supabase.com/dashboard/project/_/database/security-advisor) and [Performance Advisor](https://supabase.com/dashboard/project/_/database/performance-advisor) under Database. The advisors run automatically. You can also manually rerun them after you've resolved issues.
`.trim()

const getBasename = (path: string) => path.split('/').at(-1)!.replace(/\.md$/, '')

const DatabaseAdvisorDocs = async () => {
  const { lints, lintsList } = await getLints()

  const options = {
    mdxOptions: {
      remarkPlugins: [remarkMkDocsAdmonition, remarkPyMdownTabs, [removeTitle, meta.title]],
      rehypePlugins: [[linkTransform, urlTransform(lintsList)], rehypeSlug],
    },
  } as SerializeOptions

  return (
    <GuideTemplate meta={meta} editLink={editLink}>
      <MDXRemoteBase source={markdownIntro} />
      <Heading tag="h2">Available checks</Heading>
      <Tabs listClassNames="flex flex-wrap gap-2 [&>button]:!m-0" queryGroup="lint">
        {lints.map((lint) => (
          <TabPanel
            key={lint.path}
            id={lint.path}
            label={capitalize(getBasename(lint.path).replace(/_/g, ' '))}
          >
            <section id={getBasename(lint.path)}>
              <MDXRemoteBase source={lint.content} options={options} />
            </section>
          </TabPanel>
        ))}
      </Tabs>
    </GuideTemplate>
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

/**
 * Fetch lint remediation Markdown from external repo
 */
const getLints = async () => {
  const octokit = new Octokit({ request: { fetch: fetchRevalidatePerDay } })

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
      'Reading a directory, not a file. Should not reach this, solely to appease Typescript.'
    )
  }

  const lintsList = response.data.filter(({ path }) => /docs\/\d+.+\.md$/.test(path))

  const lints = await Promise.all(
    lintsList.map(async ({ path }) => {
      const fileResponse = await fetchRevalidatePerDay(
        `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${path}`
      )

      if (fileResponse.status >= 400) {
        throw Error(`Could not get contents of file ${org}/${repo}/${path}`)
      }

      const content = await fileResponse.text()

      return {
        path: getBasename(path),
        content,
      }
    })
  )

  return { lints, lintsList }
}

export default DatabaseAdvisorDocs
export { generateMetadata }
