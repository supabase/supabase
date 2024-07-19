import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibHeader } from '~/features/docs/Reference.header'
import { ClientLibIntroduction } from '~/features/docs/Reference.introduction'
import { ClientSdkNavigation } from '~/features/docs/Reference.navigation'
import { ClientLibRefSections } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

interface ClientSdkReferenceProps {
  libId: string
  libPath: string
  libVersion: string
  specFile: string
  useTypeSpec?: boolean
}

function ClientSdkReferencePage({
  libId,
  libPath,
  libVersion,
  specFile,
  useTypeSpec = false,
}: ClientSdkReferenceProps) {
  const menuData = NavItems[libId]

  return (
    <SidebarSkeleton
      menuId={MenuId.RefJavaScriptV2}
      NavigationMenu={
        <ClientSdkNavigation
          name={menuData.title}
          menuData={menuData}
          libPath={libPath}
          version={libVersion}
          specFile={specFile}
          excludeName={libId}
        />
      }
    >
      <LayoutMainContent>
        <article className="@container/article">
          <ClientLibHeader menuData={menuData} className="mt-4 mb-8" />
          <ClientLibIntroduction libPath={libPath} excludeName={libId} />
          <ClientLibRefSections
            libPath={libPath}
            specFile={specFile}
            excludeName={libId}
            useTypeSpec={useTypeSpec}
          />
        </article>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}

export default ClientSdkReferencePage
