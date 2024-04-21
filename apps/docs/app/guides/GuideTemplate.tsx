import { ExternalLink } from 'lucide-react'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { type PropsWithChildren } from 'react'
import { cn } from 'ui/server'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import { MDXProviderGuides } from '~/features/docs/guides/GuidesMdx.client'
import { MDXRemoteGuides } from '~/features/docs/guides/GuidesMdx'
import { type GuideFrontmatter } from '~/lib/docs'

const GuideTemplate = ({
  pathname,
  meta,
  content,
  children,
  editLink,
  mdxOptions,
}: PropsWithChildren<{
  pathname: string
  meta?: GuideFrontmatter
  content?: string
  editLink?: string
  mdxOptions?: SerializeOptions
}>) => (
  <div className={'grid grid-cols-12 relative gap-4'}>
    <div
      className={cn(
        'relative',
        'transition-all ease-out',
        'duration-100',
        meta?.hideToc ? 'col-span-12' : 'col-span-12 md:col-span-9'
      )}
    >
      <article
        // Used to get headings for the table of contents
        id="sb-docs-guide-main-article"
        className="prose max-w-none"
      >
        <h1 className="mb-0">{meta?.title || 'Supabase Docs'}</h1>
        {meta?.subtitle && <h2 className="mt-3 text-xl text-foreground-light">{meta.subtitle}</h2>}
        <div className="w-full border-b my-8"></div>
        <MDXProviderGuides>
          {content && <MDXRemoteGuides source={content} options={mdxOptions} />}
        </MDXProviderGuides>
        {children}
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
    {!meta?.hideToc && !meta?.hide_table_of_contents && (
      <GuidesTableOfContents
        video={meta?.tocVideo}
        className={cn(
          'col-span-3 self-start',
          'hidden md:block md:col-span-3',
          'sticky top-[calc(var(--header-height)+2rem)]',
          'max-h-[calc(100vh-60px-5rem)]'
        )}
      />
    )}
  </div>
)

export { GuideTemplate }
