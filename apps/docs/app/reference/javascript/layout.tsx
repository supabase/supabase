import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { ClientSdkNavigation } from '~/features/docs/Reference.navigation'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

const LIB_PATH = 'javascript'
const SPEC_FILE = 'supabase_js_v2'

function JsLayout({ children }) {
  return (
    <SidebarSkeleton
      menuId={MenuId.RefJavaScriptV2}
      NavigationMenu={<ClientSdkNavigation libPath={LIB_PATH} specFile={SPEC_FILE} />}
    >
      {children}
    </SidebarSkeleton>
  )
}

export default JsLayout
