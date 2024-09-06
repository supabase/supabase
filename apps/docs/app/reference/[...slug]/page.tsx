import { redirect } from 'next/navigation'

import { REFERENCES } from '~/content/navigation.references'
import { CliReferencePage } from '~/features/docs/Reference.cliPage'
import { ClientSdkReferencePage } from '~/features/docs/Reference.sdkPage'
import {
  generateReferenceMetadata,
  generateReferenceStaticParams,
  parseReferencePath,
  redirectNonexistentReferenceSection,
} from '~/features/docs/Reference.utils'
import { notFoundLink } from '~/features/recommendations/NotFound.utils'

export default async function ReferencePage({
  params: { slug },
}: {
  params: { slug: Array<string> }
}) {
  if (!Object.keys(REFERENCES).includes(slug[0])) {
    redirect(notFoundLink(slug.join('/')))
  }

  const parsedPath = parseReferencePath(slug)
  const isClientSdkReference = parsedPath.__type === 'clientSdk'
  const isCliReference = parsedPath.__type === 'cli'
  if (isClientSdkReference) {
    const { sdkId, maybeVersion, path } = parsedPath

    const sdkData = REFERENCES[sdkId]
    const latestVersion = sdkData.versions[0]
    const version = maybeVersion ?? latestVersion

    await redirectNonexistentReferenceSection(sdkId, version, path, version === latestVersion)

    return <ClientSdkReferencePage sdkId={sdkId} libVersion={version} />
  } else if (isCliReference) {
    return <CliReferencePage />
  } else {
    // Unimplemented -- eventually API
    redirect(notFoundLink(slug.join('/')))
  }
}

export const generateStaticParams = generateReferenceStaticParams
export const generateMetadata = generateReferenceMetadata
