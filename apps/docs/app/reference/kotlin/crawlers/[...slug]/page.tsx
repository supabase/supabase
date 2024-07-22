import {
  ClientSdkReferencePage,
  generateReferenceMetadata,
  generateReferenceStaticParams,
  redirectNonexistentReferenceSection,
} from '~/features/docs/Reference.sdkPage'

const LIB_ID = 'reference_kotlin_v2'
const LIB_PATH = 'kotlin'
const LIB_VERSION = 'v2'
const SPEC_FILE = 'supabase_kt_v2'

export default async function KotlinReferenceV2({
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

export const generateStaticParams = generateReferenceStaticParams(SPEC_FILE, LIB_ID)
export const generateMetadata = generateReferenceMetadata('kotlin')
