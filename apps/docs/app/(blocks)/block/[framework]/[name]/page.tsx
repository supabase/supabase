import { siteConfig } from '~/config/site'
import { getAllBlockIds, getBlock } from '~/lib/blocks'
import { absoluteUrl } from '~/lib/block-utils'
import { Style, styles } from '~/registry/styles'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Framework, frameworks } from '~/registry/frameworks'

export async function generateMetadata({
  params,
}: {
  params: {
    style: Style['name']
    framework: Framework['name']
    name: string
  }
}): Promise<Metadata> {
  const { name, style, framework } = params
  const block = await getBlock(name, framework)

  if (!block) {
    return {}
  }

  return {
    title: block.name,
    description: block.description,
    openGraph: {
      title: block.name,
      description: block.description,
      type: 'article',
      url: absoluteUrl(`/blocks/${block.name}`),
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
      title: block.name,
      description: block.description,
      images: [siteConfig.ogImage],
      creator: '@shadcn',
    },
  }
}

export async function generateStaticParams() {
  const blockIds = await getAllBlockIds()
  return frameworks
    .map((framework) =>
      blockIds.map((name) => ({
        style: framework.name,
        name,
      }))
    )
    .flat()
}

export default async function BlockPage({
  params,
}: {
  params: {
    style: Style['name']
    framework: Framework['name']
    name: string
  }
}) {
  const { name, style, framework } = params
  const block = await getBlock(name, framework)

  if (!block) {
    return notFound()
  }

  const Component = block.component

  return (
    <div className={block.container?.className || ''}>
      <Component />
    </div>
  )
}
