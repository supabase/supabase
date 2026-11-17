import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { reference_cli } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibIntroduction } from '~/features/docs/Reference.introduction'
import { RefSections } from '~/features/docs/Reference.sections'
import { ReferencePageShell } from '~/features/docs/Reference.shell'

export async function CliReferencePage() {
  const navigationProps = {
    libraryId: 'cli',
    name: 'Supabase CLI',
    menuData: reference_cli,
    libPath: 'cli',
    version: 'latest',
    isLatestVersion: true,
  }

  return (
    <ReferencePageShell menuId={MenuId.RefCli} navigation={navigationProps}>
      <article className="@container/article">
        <ClientLibIntroduction
          libPath="cli"
          version="latest"
          isLatestVersion={true}
          className="max-w-[unset]"
        />
        <RefSections libraryId="cli" version="latest" />
      </article>
    </ReferencePageShell>
  )
}
