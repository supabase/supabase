import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from 'ui'

import { MdxContent } from '@/components/MdxContent'
import {
  getAllCommunityDocPages,
  getCommunityDocBySlug,
  getCommunityDocNavigation,
} from '@/lib/content'

type ProjectPageProps = {
  params: Promise<{ slug: string }>
}

const generateStaticParams = async () => {
  const pages = await getAllCommunityDocPages()

  return pages.map((page) => ({ slug: page.slug }))
}

const generateMetadata = async ({ params }: ProjectPageProps): Promise<Metadata> => {
  const { slug } = await params
  const page = await getCommunityDocBySlug(slug)

  if (!page) return {}

  return {
    title: page.frontmatter.title,
    description: page.frontmatter.description,
  }
}

const ProjectPage = async ({ params }: ProjectPageProps) => {
  const { slug } = await params
  const page = await getCommunityDocBySlug(slug)

  if (!page) notFound()

  const { next, previous } = await getCommunityDocNavigation(slug)

  return (
    <main className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-8 px-6 py-12">
      <article className="col-span-12 lg:col-span-8">
        <div className="prose max-w-none">
          <h1>{page.frontmatter.title}</h1>
          <p className="text-xl text-foreground-light">{page.frontmatter.description}</p>
        </div>

        <Card className="my-8">
          <CardHeader>
            <CardTitle>Project metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 border-none">
            <dl className="grid gap-3 text-sm sm:grid-cols-[120px_1fr]">
              <dt className="text-foreground-lighter">Repository</dt>
              <dd>
                <a
                  className="text-brand transition-colors hover:text-brand-600"
                  href={page.frontmatter.repoUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {page.frontmatter.repo}
                </a>
              </dd>
              <dt className="text-foreground-lighter">Category</dt>
              <dd>{page.frontmatter.category}</dd>
              <dt className="text-foreground-lighter">Tags</dt>
              <dd className="flex flex-wrap gap-2">
                {page.frontmatter.tags.length > 0 ? (
                  page.frontmatter.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
                ) : (
                  <span className="text-foreground-lighter">No tags</span>
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <article className="prose max-w-none">
          <MdxContent source={page.content} />
        </article>

        <nav className="mt-16 grid gap-4 border-t pt-8 md:grid-cols-2">
          {previous ? (
            <Button asChild type="default">
              <Link href={`/${previous.slug}`}>Previous: {previous.frontmatter.title}</Link>
            </Button>
          ) : (
            <div />
          )}
          {next && (
            <Button asChild className="md:justify-self-end" type="default">
              <Link href={`/${next.slug}`}>Next: {next.frontmatter.title}</Link>
            </Button>
          )}
        </nav>
      </article>
    </main>
  )
}

export { generateMetadata, generateStaticParams }
export default ProjectPage
