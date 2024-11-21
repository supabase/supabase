import { notFound } from 'next/navigation'

import { REFERENCES } from '~/content/navigation.references'
import { ApiReferencePage } from '~/features/docs/Reference.apiPage'
import { CliReferencePage } from '~/features/docs/Reference.cliPage'
import { ClientSdkReferencePage } from '~/features/docs/Reference.sdkPage'
import { SelfHostingReferencePage } from '~/features/docs/Reference.selfHostingPage'
import {
  generateReferenceMetadata,
  generateReferenceStaticParams,
  parseReferencePath,
  redirectNonexistentReferenceSection,
} from '~/features/docs/Reference.utils'

export default async function ReferencePage({
  params: { slug },
}: {
  params: { slug: Array<string> }
}) {
  console.log("Generating reference page for '%o'", slug)
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
    const latestVersion = sdkData.versions[0]
    const version = maybeVersion ?? latestVersion

    await redirectNonexistentReferenceSection(sdkId, version, path, version === latestVersion)

    return <ClientSdkReferencePage sdkId={sdkId} libVersion={version} />
  } else if (isCliReference) {
    console.log('Returning CLI reference page: %o', parsedPath)
    return <CliReferencePage />
  } else if (isApiReference) {
    return <ApiReferencePage />
  } else if (isSelfHostingReference) {
    return (
      <SelfHostingReferencePage service={parsedPath.service} servicePath={parsedPath.servicePath} />
    )
  } else {
    notFound()
  }
}

export const generateStaticParams = generateReferenceStaticParams
export const generateMetadata = generateReferenceMetadata
