import { ReferenceBetaDefinitionLayout } from '~/features/reference-beta/ReferenceBeta.definitionLayout'
import { ReferenceBetaIndexLayout } from '~/features/reference-beta/ReferenceBeta.indexLayout'
import {
  getReferenceBetaStaticParams,
  resolveReferenceBetaPath,
} from '~/features/reference-beta/ReferenceBeta.utils'
import type { Metadata } from 'next'

type Params = { slug: string[] }

export const dynamicParams = false

export const generateStaticParams = getReferenceBetaStaticParams

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params
  const resolved = await resolveReferenceBetaPath(slug)

  if (resolved.type === 'index') {
    return {
      title: `${resolved.library.meta.title} reference (beta)`,
      description: resolved.library.meta.description,
    }
  }

  const { meta, library } = resolved.definition
  return {
    title: `${meta.title} | ${library.meta.title} reference (beta)`,
    description: meta.summary,
  }
}

export default async function ReferenceBetaSlugPage(props: { params: Promise<Params> }) {
  const { slug } = await props.params
  const resolved = await resolveReferenceBetaPath(slug)

  return resolved.type === 'index' ? (
    <ReferenceBetaIndexLayout library={resolved.library} />
  ) : (
    <ReferenceBetaDefinitionLayout definition={resolved.definition} />
  )
}
