import { useMemo } from 'react'

import { useParams } from 'common'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { AlertDescription_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import Table from 'components/to-be-cleaned/Table'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'

import CreatePublishableAPIKeyModal from './CreatePublishableAPIKeyModal'
import APIKeyRow from './APIKeyRow'

import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'

const PublishableAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const isProjectActive = useIsProjectActive()
  const { project, isLoading: projectIsLoading } = useProjectContext()

  const { data: projectAPI } = useProjectApiQuery({ projectRef: projectRef })

  const { data: apiKeysData } = useAPIKeysQuery({ ref: projectRef })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

  return (
    <div>
      <FormHeader
        title="Publishable API keys"
        description="Use these API keys on the web, in mobile or desktop apps, CLIs or other public components of your app. It's safe to publish these."
        actions={<CreatePublishableAPIKeyModal projectRef={projectRef} />}
      />

      <Table
        head={[
          <Table.th key="">API Key</Table.th>,
          <Table.th key="">Description</Table.th>,
          <Table.th key="actions" />,
        ]}
        body={
          publishableApiKeys.length === 0 ? (
            <Table.tr>
              <Table.td colSpan={3} className="!rounded-b-md overflow-hidden">
                <p className="text-sm text-foreground">No publishable API keys created yet</p>
                <p className="text-sm text-foreground-light">
                  Your project can't be accessed from the web using publishable API keys.
                </p>
              </Table.td>
            </Table.tr>
          ) : (
            publishableApiKeys.map((apiKey) => <APIKeyRow key={apiKey.id} apiKey={apiKey} />)
          )
        }
      />
    </div>
  )
}

export default PublishableAPIKeys
