import { FC, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { JwtSecretUpdateError, JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { IconAlertCircle, Input } from 'ui'

import { configKeys } from 'data/config/keys'
import { useQueryClient } from '@tanstack/react-query'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useStore, useProjectPostgrestConfig, useJwtSecretUpdateStatus } from 'hooks'

import Panel from 'components/ui/Panel'
import PostgrestConfig from './PostgrestConfig'
import { DisplayApiSettings } from 'components/ui/ProjectSettings'
import { JWT_SECRET_UPDATE_ERROR_MESSAGES } from './API.constants'
import { IS_PLATFORM } from 'lib/constants'
import JWTSettings from './JWTSettings'

interface Props {
  projectRef: string
}

const ServiceList: FC<Props> = ({ projectRef }) => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = router.query
  const queryClient = useQueryClient()

  const { data: settings, isError } = useProjectSettingsQuery({ projectRef: ref as string })
  const { mutateConfig } = useProjectPostgrestConfig(ref as string | undefined)
  const { jwtSecretUpdateError, jwtSecretUpdateStatus }: any = useJwtSecretUpdateStatus(ref)

  const previousJwtSecretUpdateStatus = useRef()
  const { Failed, Updated, Updating } = JwtSecretUpdateStatus
  const jwtSecretUpdateErrorMessage =
    JWT_SECRET_UPDATE_ERROR_MESSAGES[jwtSecretUpdateError as JwtSecretUpdateError]

  useEffect(() => {
    if (previousJwtSecretUpdateStatus.current === Updating) {
      switch (jwtSecretUpdateStatus) {
        case Updated:
          mutateConfig()
          queryClient.invalidateQueries({ queryKey: configKeys.settings(projectRef) })
          ui.setNotification({ category: 'success', message: 'Successfully updated JWT secret' })
          break
        case Failed:
          ui.setNotification({
            category: 'error',
            message: `JWT secret update failed: ${jwtSecretUpdateErrorMessage}`,
          })
          break
      }
    }

    previousJwtSecretUpdateStatus.current = jwtSecretUpdateStatus
  }, [jwtSecretUpdateStatus])

  // Get the API service
  const apiService = settings?.autoApiService
  const apiUrl = `${apiService?.protocol ?? 'https'}://${apiService?.endpoint ?? '-'}`

  return (
    <div>
      <h3 className="text-scale-1200 mb-6 text-xl">API Settings</h3>
      <section>
        <Panel title={<h5 className="mb-0">Project URL</h5>}>
          <Panel.Content>
            {isError ? (
              <div className="flex items-center justify-center space-x-2 py-4">
                <IconAlertCircle size={16} strokeWidth={1.5} />
                <p className="text-sm text-scale-1100">Failed to retrieve project URL</p>
              </div>
            ) : (
              <Input
                copy
                label="URL"
                readOnly
                disabled
                className="input-mono"
                value={apiUrl}
                descriptionText="A RESTful endpoint for querying and managing your database."
                layout="horizontal"
              />
            )}
          </Panel.Content>
        </Panel>
      </section>

      <section>
        <DisplayApiSettings key="DisplayAPISettings" />
      </section>

      <section>
        <JWTSettings />
      </section>

      <section>
        <PostgrestConfig />
      </section>
    </div>
  )
}

export default ServiceList
