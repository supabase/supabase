import {
  ClientSdkReferencePage,
  generateReferenceMetadata,
  generateReferenceStaticParams,
  redirectNonexistentReferenceSection,
} from '~/features/docs/Reference.sdkPage'

const LIB_ID = 'reference_kotlin_v1'
const LIB_PATH = 'kotlin'
const LIB_VERSION = 'v1'
const SPEC_FILE = 'supabase_kt_v1'

export default async function KotlinReferenceV1({
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
export const metadata = generateReferenceMetadata('kotlin', 'v1')
