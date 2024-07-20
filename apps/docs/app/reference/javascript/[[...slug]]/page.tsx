import {
  ClientSdkReferencePage,
  generateReferenceStaticParams,
} from '~/features/docs/Reference.sdkPage'

const LIB_ID = 'reference_javascript_v2'
const LIB_PATH = 'javascript'
const LIB_VERSION = 'v2'
const SPEC_FILE = 'supabase_js_v2'

async function JsReferenceV2({ params: { slug } }: { params: { slug?: Array<string> } }) {
  return (
    <ClientSdkReferencePage
      libId={LIB_ID}
      libPath={LIB_PATH}
      libVersion={LIB_VERSION}
      specFile={SPEC_FILE}
      initialSelectedSection={slug}
      useTypeSpec
    />
  )
}

export const generateStaticParams = generateReferenceStaticParams(SPEC_FILE, LIB_ID)
export default JsReferenceV2
