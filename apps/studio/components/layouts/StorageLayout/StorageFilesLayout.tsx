import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import { DocsButton } from 'components/ui/DocsButton'
import { PageLayout } from '../PageLayout/PageLayout'
import { ScaffoldContainer } from '../Scaffold'

export const StorageFilesLayout = ({ children }: PropsWithChildren) => {
  const { ref } = useParams()

  const config = BUCKET_TYPES.files
  const navigationItems = [
    {
      label: 'Buckets',
      href: `/project/${ref}/storage/files`,
    },
    {
      label: 'Settings',
      href: `/project/${ref}/storage/files/settings`,
    },
    {
      label: 'Policies',
      href: `/project/${ref}/storage/files/policies`,
    },
  ]

  return (
    <PageLayout
      title={config?.displayName || 'Storage'}
      subtitle={config?.description || 'Manage your storage buckets and files.'}
      navigationItems={navigationItems}
      secondaryActions={[<DocsButton key="docs" href={config.docsUrl} />]}
    >
      <ScaffoldContainer>{children}</ScaffoldContainer>
    </PageLayout>
  )
}
