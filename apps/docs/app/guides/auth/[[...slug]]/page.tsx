import matter from 'gray-matter'
import { ExternalLink } from 'lucide-react'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { readFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { IconPanel } from 'ui-patterns/IconPanel'
import { Admonition, cn } from 'ui/server'

import { AppleSecretGenerator } from '~/components/AppleSecretGenerator'
import AuthProviders from '~/components/AuthProviders'
import { Heading } from '~/components/CustomHTMLElements'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import {
  GetSessionWarning,
  SocialProviderSettingsSupabase,
  SocialProviderSetup,
} from '~/components/MDX/partials'
import { Mermaid } from '~/components/Mermaid'
import { NavData } from '~/components/NavData'
import { ProjectConfigVariables } from '~/components/ProjectConfigVariables'
import StepHikeCompact from '~/components/StepHikeCompact'
import { Accordion, AccordionItem } from '~/features/ui/Accordion'
import { CH, CHCode } from '~/features/ui/CodeHike'
import { Tabs, TabPanel } from '~/features/ui/Tabs'
import { GUIDES_DIRECTORY, isValidGuideFrontmatter } from '~/lib/docs'

const mdxOptions: SerializeOptions = {
  mdxOptions: {
    useDynamicImport: true,
    remarkPlugins: [[remarkMath, { singleDollarTextMath: false }], remarkGfm],
    rehypePlugins: [rehypeKatex as any],
  },
}

const getGuidesMarkdown = async (section: string, params: { slug?: string[] }) => {
  const relPath = (section + '/' + (params?.slug?.join(sep) ?? '')).replace(/\/$/, '')
  const fullPath = join(GUIDES_DIRECTORY, relPath + '.mdx')
  /**
   * SAFETY CHECK:
   * Prevent accessing anything outside of GUIDES_DIRECTORY
   */
  if (!fullPath.startsWith(GUIDES_DIRECTORY)) {
    throw Error('Accessing forbidden route. Content must be within the GUIDES_DIRECTORY.')
  }

  const mdx = await readFile(fullPath, 'utf-8')

  const editLink = `supabase/supabase/blob/master/apps/docs/content/guides/${relPath}.mdx`

  const { data: frontmatter, content } = matter(mdx)
  if (!isValidGuideFrontmatter(frontmatter)) {
    throw Error('Type of frontmatter is not valid')
  }

  return {
    pathname: relPath,
    frontmatter,
    content,
    editLink,
  }
}

const components = {
  Accordion,
  AccordionItem,
  Admonition,
  AppleSecretGenerator,
  AuthProviders,
  CH,
  CHCode,
  GetSessionWarning,
  GlassPanel,
  IconPanel,
  Link,
  Mermaid,
  NavData,
  ProjectConfigVariables,
  SocialProviderSettingsSupabase,
  SocialProviderSetup,
  StepHikeCompact,
  Tabs,
  TabPanel,
  h2: (props: any) => (
    <Heading tag="h2" {...props}>
      {props.children}
    </Heading>
  ),
  h3: (props: any) => (
    <Heading tag="h3" {...props}>
      {props.children}
    </Heading>
  ),
  h4: (props: any) => (
    <Heading tag="h4" {...props}>
      {props.children}
    </Heading>
  ),
}

const AuthGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { pathname, frontmatter, content, editLink } = await getGuidesMarkdown('auth', params)
  const { hideToc, ...meta } = frontmatter

  return (
    <div className={'grid grid-cols-12 relative gap-4'}>
      <div
        className={[
          'relative',
          'transition-all ease-out',
          'duration-100',
          !hideToc ? 'col-span-12 md:col-span-9' : 'col-span-12',
        ].join(' ')}
      >
        <article
          // Used to get headings for the table of contents
          id="sb-docs-guide-main-article"
          className="prose max-w-none"
        >
          <h1 className="mb-0">{meta?.title || 'Supabase Docs'}</h1>
          {meta?.subtitle && (
            <h2 className="mt-3 text-xl text-foreground-light">{meta.subtitle}</h2>
          )}
          <div className="w-full border-b my-8"></div>
          <MDXRemote source={content} components={components} options={mdxOptions} />
          <div className="mt-16 not-prose">
            <div>
              <a
                href={`https://github.com/${
                  editLink ||
                  `supabase/supabase/edit/master/apps/docs/content/guides/auth${pathname}.mdx`
                }
                    `}
                className="text-sm transition flex items-center gap-1 text-scale-1000 hover:text-scale-1200 w-fit"
              >
                Edit this page on GitHub <ExternalLink size={14} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </article>
      </div>
      {!hideToc && !meta?.hide_table_of_contents && (
        <GuidesTableOfContents
          video={meta?.tocVideo}
          className={cn(
            'col-span-3 self-start',
            'hidden md:block md:col-span-3',
            'sticky top-0',
            'max-h-[calc(100vh-60px-5rem)]'
          )}
        />
      )}
    </div>
  )
}

export default AuthGuide
