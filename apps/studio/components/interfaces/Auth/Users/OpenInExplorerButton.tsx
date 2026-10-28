import { Button } from 'ui'

import { useIsExplorerEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useOpenEntityQuery } from '@/components/interfaces/Explorer/hooks'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

/**
 * For people trying the Explorer preview: users are `auth.users` there, with the same user
 * details and actions, alongside the SQL that lists them.
 */
export const OpenInExplorerButton = () => {
  const isExplorerEnabled = useIsExplorerEnabled()
  const { openEntityQuery } = useOpenEntityQuery()

  if (!isExplorerEnabled) return null

  return (
    <Button
      variant="default"
      onClick={() => openEntityQuery({ schema: 'auth', name: 'users', type: ENTITY_TYPE.TABLE })}
    >
      Open in Explorer
    </Button>
  )
}
