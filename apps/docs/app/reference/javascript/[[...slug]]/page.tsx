import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibHeader } from '~/features/docs/Reference.header'
import { ClientSdkNavigation } from '~/features/docs/Reference.navigation'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

const LIB_ID = 'reference_javascript_v2'
const LIB_PATH = 'javascript'
const LIB_VERSION = 'v2'
const SPEC_FILE = 'supabase_js_v2'

function JsReferenceV2() {
  const menuData = NavItems[LIB_ID]

  console.log(menuData)

  return (
    <SidebarSkeleton
      menuId={MenuId.RefJavaScriptV2}
      NavigationMenu={
        <ClientSdkNavigation
          name={menuData.title}
          menuId={MenuId.RefJavaScriptV2}
          menuData={menuData}
          libPath={LIB_PATH}
          version={LIB_VERSION}
          specFile={SPEC_FILE}
          excludeName={LIB_ID}
        />
      }
    >
      <article>
        <ClientLibHeader menuData={menuData} />
      </article>
    </SidebarSkeleton>
  )
}

export default JsReferenceV2
