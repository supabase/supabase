import ClientSdkReferencePage from '~/features/docs/Reference.sdkPage'

const LIB_ID = 'reference_javascript_v2'
const LIB_PATH = 'javascript'
const LIB_VERSION = 'v2'
const SPEC_FILE = 'supabase_js_v2'

function JsReferenceV2() {
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

export default JsReferenceV2
