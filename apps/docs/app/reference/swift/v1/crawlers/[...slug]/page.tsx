import {
  ClientSdkReferencePage,
  generateReferenceMetadata,
  generateReferenceStaticParams,
  redirectNonexistentReferenceSection,
} from '~/features/docs/Reference.sdkPage'

const LIB_ID = 'reference_swift_v1'
const LIB_PATH = 'swift'
const LIB_VERSION = 'v1'
const SPEC_FILE = 'supabase_swift_v1'

export default async function SwiftReferenceV1({
  params: { slug },
}: {
  params: { slug: Array<string> }
}) {
  await redirectNonexistentReferenceSection(slug, SPEC_FILE, LIB_ID)

  return (
    <ClientSdkReferencePage
      libId={LIB_ID}
      libPath={LIB_PATH}
      libVersion={LIB_VERSION}
      specFile={SPEC_FILE}
      isCrawlerPage
      requestedSection={slug[0]}
    />
  )
}

export const generateStaticParams = generateReferenceStaticParams(SPEC_FILE, LIB_ID, {
  generateIndexPage: false,
})
export const generateMetadata = generateReferenceMetadata('swift', 'v1')
