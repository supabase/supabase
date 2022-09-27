import useSWR from 'swr'
import { FC, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { JwtSecretUpdateError, JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { IconAlertCircle, Input } from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import {
  useStore,
  useProjectSettings,
  useProjectPostgrestConfig,
  useJwtSecretUpdateStatus,
} from 'hooks'

import Panel from 'components/ui/Panel'
import PostgrestConfig from './PostgrestConfig'
import { DisplayApiSettings } from 'components/ui/ProjectSettings'
import { JWT_SECRET_UPDATE_ERROR_MESSAGES } from './API.constants'
import JWTSettings from './JWTSettings'

interface Props {
  projectRef: string
}

const ServiceList: FC<Props> = ({ projectRef }) => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = router.query

  const { services, isError, mutateSettings } = useProjectSettings(ref as string | undefined)
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
          mutateSettings()
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
  const API_SERVICE_ID = 1
  const apiService = services ? services.find((x: any) => x.app.id == API_SERVICE_ID) : {}
  const apiConfig = apiService?.app_config

  return (
    <>
      <div className="">
        <section>
          <Panel title={<h5 className="mb-0">Project URL</h5>}>
            <Panel.Content>
              {isError ? (
                <div className="py-4 flex items-center justify-center space-x-2">
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
                  value={`https://${apiConfig?.endpoint ?? '-'}`}
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
    </>
  )
}

export default ServiceList
