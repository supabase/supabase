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
import { RefSections } from '~/features/docs/Reference.sections'
import { ReferencePageShell } from '~/features/docs/Reference.shell'

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

  const navigationProps = {
    libraryId: servicePath,
    name,
    menuData,
    libPath: servicePath,
    version: 'latest',
    isLatestVersion: true,
  }

  return (
    <ReferencePageShell menuId={menuId} navigation={navigationProps}>
      <article className="@container/article">
        <ClientLibIntroduction
          libPath={servicePath}
          version="latest"
          isLatestVersion={true}
          className="max-w-[unset]"
        />
        <RefSections libraryId={servicePath} version="latest" />
      </article>
    </ReferencePageShell>
  )
}
