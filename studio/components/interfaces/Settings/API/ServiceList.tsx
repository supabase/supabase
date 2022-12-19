import { JwtSecretUpdateError, JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useEffect, useRef } from 'react'
import { IconAlertCircle, Input } from 'ui'

import { useJwtSecretUpdateStatus, useParams, useProjectPostgrestConfig, useStore } from 'hooks'

import Panel from 'components/ui/Panel'
import { DisplayApiSettings } from 'components/ui/ProjectSettings'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { JWT_SECRET_UPDATE_ERROR_MESSAGES } from './API.constants'
import { PROJECT_ENDPOINT_PROTOCOL } from 'pages/api/constants'
import { IS_PLATFORM } from 'lib/constants'
import JWTSettings from './JWTSettings'
import PostgrestConfig from './PostgrestConfig'

const ServiceList = () => {
  const { ui } = useStore()

  const { ref: projectRef } = useParams()
  const { data: settings, isError } = useProjectApiQuery({
    projectRef,
  })

  const { mutateConfig } = useProjectPostgrestConfig(projectRef as string | undefined)
  const { jwtSecretUpdateError, jwtSecretUpdateStatus }: any = useJwtSecretUpdateStatus(projectRef)

  const previousJwtSecretUpdateStatus = useRef()
  const { Failed, Updated, Updating } = JwtSecretUpdateStatus
  const jwtSecretUpdateErrorMessage =
    JWT_SECRET_UPDATE_ERROR_MESSAGES[jwtSecretUpdateError as JwtSecretUpdateError]

  useEffect(() => {
    if (previousJwtSecretUpdateStatus.current === Updating) {
      switch (jwtSecretUpdateStatus) {
        case Updated:
          mutateConfig()
          // mutateSettings()
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

  const endpoint = settings?.autoApiService.app_config.endpoint ?? '-'

  return (
    <div>
      <h3 className="mb-6 text-xl text-scale-1200">API Settings</h3>
      <section>
        <Panel title={<h5 className="mb-0">Project URL</h5>}>
          <Panel.Content>
            {isError ? (
              <div className="flex items-center justify-center py-4 space-x-2">
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
                value={`${IS_PLATFORM ? 'https' : PROJECT_ENDPOINT_PROTOCOL}://${endpoint}`}
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
