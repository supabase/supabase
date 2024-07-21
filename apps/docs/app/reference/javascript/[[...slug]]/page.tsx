import {
  ClientSdkReferencePage,
  generateReferenceStaticParams,
  redirectNonexistentReferenceSection,
} from '~/features/docs/Reference.sdkPage'

const LIB_ID = 'reference_javascript_v2'
const LIB_PATH = 'javascript'
const LIB_VERSION = 'v2'
const SPEC_FILE = 'supabase_js_v2'

async function TimingWrapper(params) {
  const start = performance.now()
  const result = await JsReferenceV2(params)
  console.log(`\n\n\nJS PAGE BUILD TIME: ${(performance.now() - start) / 1000} seconds`)
  return result
}

async function JsReferenceV2({ params: { slug } }: { params: { slug?: Array<string> } }) {
  await redirectNonexistentReferenceSection(slug, SPEC_FILE, LIB_ID)

  return (
    <ClientSdkReferencePage
      libId={LIB_ID}
      libPath={LIB_PATH}
      libVersion={LIB_VERSION}
      specFile={SPEC_FILE}
      useTypeSpec
    />
  )
}

export const generateStaticParams = generateReferenceStaticParams(SPEC_FILE, LIB_ID)
export default TimingWrapper
