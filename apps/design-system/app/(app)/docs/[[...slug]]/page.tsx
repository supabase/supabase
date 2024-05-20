import { notFound } from 'next/navigation'
import { allDocs } from 'contentlayer/generated'

import '@/styles/mdx.css'
import '@/styles/code-block-variables.css'
import type { Metadata } from 'next'
import Link from 'next/link'
// import { ChevronRightIcon, ExternalLinkIcon } from '@radix-ui/react-icons'
import Balancer from 'react-wrap-balancer'

import { siteConfig } from '@/config/site'
import { getTableOfContents } from '@/lib/toc'
import { absoluteUrl, cn } from '@/lib/utils'
import { Mdx } from '@/components/mdx-components'
import { DocsPager } from '@/components/pager'
import { DashboardTableOfContents } from '@/components/toc'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { Button, ScrollArea } from 'ui'
// import { badgeVariants } from 'ui/src/components/shadcn/ui/badge'
// import { buttonVariants } from '@ui/components/Button/Button'
// import { ScrollArea } from '@/registry/new-york/ui/scroll-area'

interface DocPageProps {
  params: {
    slug: string[]
  }
}

async function getDocFromParams({ params }: DocPageProps) {
  const slug = params.slug?.join('/') || ''
  const doc = allDocs.find((doc) => doc.slugAsParams === slug)

  if (!doc) {
    return null
  }

  return doc
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const doc = await getDocFromParams({ params })

  if (!doc) {
    return {}
  }

  return {
    title: doc.title,
    description: doc.description,
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: 'article',
      url: absoluteUrl(doc.slug),
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.title,
      description: doc.description,
      images: [siteConfig.ogImage],
      creator: '@shadcn',
    },
  }
}

export async function generateStaticParams(): Promise<DocPageProps['params'][]> {
  return allDocs.map((doc) => ({
    slug: doc.slugAsParams.split('/'),
  }))
}

export default async function DocPage({ params }: DocPageProps) {
  const doc = await getDocFromParams({ params })

  if (!doc) {
    notFound()
  }

  const toc = await getTableOfContents(doc.body.raw)

  return (
    <main className="relative lg:gap-10 xl:grid xl:grid-cols-[1fr_200px] pr-6 lg:py-8">
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <div className="mb-4 flex items-center space-x-1 text-sm text-foreground-muted">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap">Docs</div>
          <ChevronRight className="h-4 w-4 text-foreground-muted" />
          <div className="text-foreground-lighter">{doc.title}</div>
        </div>
        <div className="space-y-2">
          <h1 className={cn('scroll-m-20 text-4xl tracking-tight')}>{doc.title}</h1>
          {doc.description && (
            <p className="text-lg text-foreground-light">
              <Balancer>{doc.description}</Balancer>
            </p>
          )}
        </div>
        {/* {doc.links ? (
          <div className="flex items-center space-x-2 pt-4">
            {doc.links?.doc && (
              <Button
                type="default"
                icon={<ExternalLink className="h-3 w-3 text-foreground-muted" strokeWidth={1} />}
              >
                <Link
                  href={doc.links.doc}
                  target="_blank"
                  rel="noreferrer"

                  // className={cn(buttonVariants({ variant: 'default' }), 'gap-1')}
                >
                  Docs
                </Link>
              </Button>
            )}
            {doc.links?.api && (
              <Button
                type="default"
                icon={<ExternalLink className="h-3 w-3 text-foreground-muted" strokeWidth={1} />}
              >
                <Link
                  href={doc.links.api}
                  target="_blank"
                  rel="noreferrer"

                  // className={cn(badgeVariants({ variant: 'default' }), 'gap-1')}
                >
                  API Reference
                </Link>
              </Button>
            )}
          </div>
        ) : null} */}
        {doc.source?.radix && (
          <div className="bg-purple-100 border border-purple-600 rounded-md flex items-center p-3 px-5 gap-6 mt-6">
            <svg
              width="76"
              height="24"
              viewBox="0 0 76 24"
              fill="currentcolor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M43.9022 20.0061H46.4499C46.2647 19.0375 46.17 18.1161 46.17 17.0058V12.3753C46.17 9.25687 44.3893 7.72127 41.1943 7.72127C38.3003 7.72127 36.3324 9.23324 36.0777 11.8083H38.9254C39.0181 10.698 39.8052 9.96561 41.1017 9.96561C42.4446 9.96561 43.3243 10.6743 43.3243 12.1391V12.7061L39.8052 13.1077C37.4206 13.3912 35.5684 14.3834 35.5684 16.7931C35.5684 18.9666 37.2353 20.2659 39.5274 20.2659C41.4027 20.2659 42.9845 19.4863 43.6401 18.1161C43.6689 18.937 43.9022 20.0061 43.9022 20.0061ZM40.3377 18.1634C39.157 18.1634 38.5087 17.5727 38.5087 16.6278C38.5087 15.3757 39.4579 15.0922 40.7082 14.9268L43.3243 14.6197V15.352C43.3243 17.242 41.8658 18.1634 40.3377 18.1634ZM56.2588 20.0061H59.176V3H56.2125V9.96561C55.6569 8.76075 54.3141 7.72127 52.4851 7.72127C49.3058 7.72127 47.099 10.2963 47.099 14.0054C47.099 17.7381 49.3058 20.2896 52.4851 20.2896C54.2678 20.2896 55.68 19.2973 56.2588 18.0925V20.0061ZM56.282 14.218C56.282 16.5569 55.1938 18.0689 53.3185 18.0689C51.3969 18.0689 50.1856 16.486 50.1856 14.0054C50.1856 11.5485 51.3969 9.94198 53.3185 9.94198C55.1938 9.94198 56.282 11.454 56.282 13.7928V14.218ZM60.9066 5.97304H64.0553V3.01996H60.9066V5.97304ZM60.9992 20.0061H63.9627V8.00476H60.9992V20.0061ZM67.6638 20.0061L70.6041 15.8954L73.5212 20.0061H76.9246L72.3636 13.7219L76.5542 8.00476H73.3823L70.7661 11.7138L68.1731 8.00476H64.7697L69.0066 13.8637L64.4919 20.0061H67.6638Z"></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M24.9132 20V14.0168H28.7986L32.4513 20H35.7006L31.6894 13.5686C33.5045 12.986 35.0955 11.507 35.0955 9.01961C35.0955 5.7479 32.7994 4 28.9571 4H22V20H24.9132ZM24.9132 6.35294V11.6863H28.821C31.0395 11.6863 32.1599 10.7675 32.1599 9.01961C32.1599 7.27171 30.9395 6.35294 28.621 6.35294H24.9132Z"
              ></path>
              <path d="M7 23C3.13401 23 0 19.6422 0 15.5C0 11.3578 3.13401 8 7 8V23Z"></path>
              <path d="M7 0H0V7H7V0Z"></path>
              <path d="M11.5 7C13.433 7 15 5.433 15 3.5C15 1.567 13.433 0 11.5 0C9.56704 0 8 1.567 8 3.5C8 5.433 9.56704 7 11.5 7Z"></path>
            </svg>
            <div className="flex flex-row items-center justify-between text-sm w-full font-mono">
              <span className="text-foreground-light">This component uses Radix UI</span>
              {doc.links ? (
                <div className="flex items-center gap-2 justify-end">
                  {doc.links?.doc && (
                    <Button
                      type="outline"
                      className="rounded-full"
                      icon={<ExternalLink className="text-foreground-muted" strokeWidth={1} />}
                    >
                      <Link
                        href={doc.links.doc}
                        target="_blank"
                        rel="noreferrer"

                        // className={cn(buttonVariants({ variant: 'default' }), 'gap-1')}
                      >
                        Docs
                      </Link>
                    </Button>
                  )}
                  {doc.links?.api && (
                    <Button
                      type="outline"
                      className="rounded-full"
                      icon={<ExternalLink className="text-foreground-muted" strokeWidth={1} />}
                    >
                      <Link
                        href={doc.links.api}
                        target="_blank"
                        rel="noreferrer"

                        // className={cn(badgeVariants({ variant: 'default' }), 'gap-1')}
                      >
                        API Reference
                      </Link>
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          //
          //
        )}
        <div className="pb-12">
          <Mdx code={doc.body.code} />
        </div>
        <DocsPager doc={doc} />
      </div>
      {doc.toc && (
        <div className="hidden text-sm xl:block">
          <div className="sticky top-16 -mt-10 pt-4">
            <ScrollArea className="pb-10">
              <div className="sticky top-16 -mt-10 h-[calc(100vh-3.5rem)] py-12">
                <DashboardTableOfContents toc={toc} />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </main>
  )
}
