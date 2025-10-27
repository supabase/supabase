import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import {
  reference_self_hosting_analytics,
  reference_self_hosting_auth,
  reference_self_hosting_functions,
  reference_self_hosting_realtime,
  reference_self_hosting_storage,
} from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { REFERENCES } from '~/content/navigation.references'
import { ClientLibIntroduction } from '~/features/docs/Reference.introduction'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { RefSections } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export async function SelfHostingReferencePage({
  service,
  servicePath,
}: {
  service: string
  servicePath: string
}) {
  const menuId =
    service === 'analytics'
      ? MenuId.SelfHostingAnalytics
      : service === 'auth'
        ? MenuId.SelfHostingAuth
        : service === 'functions'
          ? MenuId.SelfHostingFunctions
          : service === 'realtime'
            ? MenuId.SelfHostingRealtime
            : service === 'storage'
              ? MenuId.SelfHostingStorage
              : MenuId.SelfHosting

  const menuData =
    service === 'analytics'
      ? reference_self_hosting_analytics
      : service === 'auth'
        ? reference_self_hosting_auth
        : service === 'functions'
          ? reference_self_hosting_functions
          : service === 'realtime'
            ? reference_self_hosting_realtime
            : reference_self_hosting_storage

  const name = REFERENCES[servicePath.replaceAll('-', '_')].name

  return (
    <ReferenceContentScrollHandler libPath={servicePath} version="latest" isLatestVersion={true}>
      <SidebarSkeleton
        menuId={menuId}
        NavigationMenu={
          <ReferenceNavigation
            libraryId={servicePath}
            name={name}
            menuData={menuData}
            libPath={servicePath}
            version="latest"
            isLatestVersion={true}
          />
        }
      >
        <LayoutMainContent>
          <article className="@container/article">
            <ClientLibIntroduction
              libPath={servicePath}
              version="latest"
              isLatestVersion={true}
              className="max-w-[unset]"
            />
            <RefSections libraryId={servicePath} version="latest" />
          </article>
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}
