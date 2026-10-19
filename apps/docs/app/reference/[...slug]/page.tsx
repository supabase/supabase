import { REFERENCES } from '~/content/navigation.references'
import { ApiReferencePage } from '~/features/docs/Reference.apiPage'
import { CliReferencePage } from '~/features/docs/Reference.cliPage'
import { ClientSdkReferencePage } from '~/features/docs/Reference.sdkPage'
import { SelfHostingReferencePage } from '~/features/docs/Reference.selfHostingPage'
import {
  generateReferenceJsonLd,
  generateReferenceMetadata,
  generateReferenceStaticParams,
  parseReferencePath,
  redirectNonexistentReferenceSection,
} from '~/features/docs/Reference.utils'
import { serializeJsonLd } from '~/lib/json-ld'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

export const dynamicParams = false

export default async function ReferencePage(props: { params: Promise<{ slug: Array<string> }> }) {
  const params = await props.params
  let page: ReactNode

  const { slug } = params

  if (!Object.keys(REFERENCES).includes(slug[0].replaceAll('-', '_'))) {
    notFound()
  }

  const parsedPath = parseReferencePath(slug)
  const isClientSdkReference = parsedPath.__type === 'clientSdk'
  const isCliReference = parsedPath.__type === 'cli'
  const isApiReference = parsedPath.__type === 'api'
  const isSelfHostingReference = parsedPath.__type === 'self-hosting'

  if (isClientSdkReference) {
    const { sdkId, maybeVersion, path } = parsedPath

    const sdkData = REFERENCES[sdkId]
    if (sdkData.enabled === false) {
      notFound()
    }

    const latestVersion = sdkData.versions[0]
    const version = maybeVersion ?? latestVersion

    await redirectNonexistentReferenceSection(sdkId, version, path, version === latestVersion)

    page = <ClientSdkReferencePage sdkId={sdkId} libVersion={version} />
  } else if (isCliReference) {
    page = <CliReferencePage />
  } else if (isApiReference) {
    page = <ApiReferencePage path={parsedPath.path} />
  } else if (isSelfHostingReference) {
    page = (
      <SelfHostingReferencePage service={parsedPath.service} servicePath={parsedPath.servicePath} />
    )
  } else {
    notFound()
  }

  const jsonLd = await generateReferenceJsonLd(slug)
  const jsonLdScript = jsonLd ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  ) : null

  return (
    <>
      {jsonLdScript}
      {page}
    </>
  )
}

export const generateStaticParams = generateReferenceStaticParams
export const generateMetadata = generateReferenceMetadata
