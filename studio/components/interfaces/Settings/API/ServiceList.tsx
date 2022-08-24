import useSWR from 'swr'
import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  JwtSecretUpdateError,
  JwtSecretUpdateProgress,
  JwtSecretUpdateStatus,
} from '@supabase/shared-types/out/events'
import {
  Alert,
  Typography,
  Input,
  Modal,
  IconKey,
  Button,
  Dropdown,
  IconPenTool,
  IconRefreshCw,
  IconChevronDown,
  IconLoader,
  IconEye,
  IconEyeOff,
} from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { patch, get } from 'lib/common/fetch'
import { useStore, useJwtSecretUpdateStatus, checkPermissions } from 'hooks'

import Panel from 'components/ui/Panel'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import PostgrestConfig from './PostgrestConfig'
import { DisplayApiSettings } from 'components/ui/ProjectSettings'
import {
  JWT_SECRET_UPDATE_ERROR_MESSAGES,
  JWT_SECRET_UPDATE_PROGRESS_MESSAGES,
} from './API.constants'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface Props {
  projectRef: string
}

const ServiceList: FC<Props> = ({ projectRef }) => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = router.query

  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false)
  const [customToken, setCustomToken] = useState<string>('')
  const [isRegeneratingKey, setIsGeneratingKey] = useState<boolean>(false)
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false)
  const [isSubmittingJwtSecretUpdateRequest, setIsSubmittingJwtSecretUpdateRequest] =
    useState<boolean>(false)

  const {
    data,
    error,
    mutate: mutateSettings,
  }: any = useSWR(`${API_URL}/props/project/${projectRef}/settings`, get)
  const { data: config, mutate: mutateConfig }: any = useSWR(
    `${API_URL}/projects/${projectRef}/config/postgrest`,
    get
  )
  const {
    changeTrackingId,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
    jwtSecretUpdateError,
    jwtSecretUpdateProgress,
    jwtSecretUpdateStatus,
    mutateJwtSecretUpdateStatus,
  }: any = useJwtSecretUpdateStatus(ref)

  const { Failed, Updated, Updating } = JwtSecretUpdateStatus

  const isJwtSecretUpdateFailed = jwtSecretUpdateStatus === Failed
  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === Updated
  const isUpdatingJwtSecret = jwtSecretUpdateStatus === Updating
  const jwtSecretUpdateErrorMessage =
    JWT_SECRET_UPDATE_ERROR_MESSAGES[jwtSecretUpdateError as JwtSecretUpdateError]
  const jwtSecretUpdateProgressMessage =
    JWT_SECRET_UPDATE_PROGRESS_MESSAGES[jwtSecretUpdateProgress as JwtSecretUpdateProgress]

  const previousJwtSecretUpdateStatus = useRef()

  const canReadJWTSecret = checkPermissions(PermissionAction.READ, 'postgrest_config')
  const canGenerateNewJWTSecret = checkPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.projects.update_jwt'
  )

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

  if (error || isJwtSecretUpdateStatusError) {
    return (
      <div className="mx-auto p-6 text-center sm:w-full md:w-3/4">
        <Typography.Title level={3}>Error loading API settings</Typography.Title>
      </div>
    )
  }
  if (!data || isJwtSecretUpdateStatusLoading) {
    return (
      <div className="mx-auto p-6 text-center sm:w-full md:w-3/4">
        <Typography.Title level={3}>Loading...</Typography.Title>
      </div>
    )
  }

  const { services } = data

  // Get the API service
  const API_SERVICE_ID = 1
  const apiService = services.find((x: any) => x.app.id == API_SERVICE_ID)
  const apiConfig = apiService?.app_config

  async function handleJwtSecretUpdate(
    jwt_secret: string,
    setModalVisibility: Dispatch<SetStateAction<boolean>>
  ) {
    setIsSubmittingJwtSecretUpdateRequest(true)
    try {
      const trackingId = uuidv4()
      const res = await patch(`${API_URL}/projects/${ref}/config/secrets`, {
        jwt_secret,
        change_tracking_id: trackingId,
      })
      if (res.error) throw res.error
      setModalVisibility(false)
      mutateJwtSecretUpdateStatus()
      ui.setNotification({
        category: 'info',
        message:
          'Successfully submitted JWT secret update request. Please wait while your project is updated.',
      })
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: error.message })
    } finally {
      setIsSubmittingJwtSecretUpdateRequest(false)
    }
  }

  return (
    <>
      <div className="max-w-4xl p-4">
        <section>
          <Panel
            title={
              <Typography.Title level={5} className="mb-0">
                Project URL
              </Typography.Title>
            }
          >
            <Panel.Content>
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
            </Panel.Content>
          </Panel>
        </section>

        <section>
          <DisplayApiSettings key="DisplayAPISettings" />
        </section>

        <section>
          <Panel
            title={
              <Typography.Title level={5} className="mb-0">
                JWT Settings
              </Typography.Title>
            }
          >
            <Panel.Content className="border-panel-border-interior-light dark:border-panel-border-interior-dark space-y-6 border-t">
              <Input
                label="JWT Secret"
                readOnly
                copy={canReadJWTSecret && isNotUpdatingJwtSecret}
                reveal={canReadJWTSecret && isNotUpdatingJwtSecret}
                disabled
                value={
                  !canReadJWTSecret
                    ? 'You need additional permissions to view the JWT secret'
                    : isJwtSecretUpdateFailed
                    ? 'JWT secret update failed'
                    : isUpdatingJwtSecret
                    ? 'Updating JWT secret...'
                    : config?.jwt_secret || ''
                }
                className="input-mono"
                descriptionText={
                  'Used to decode your JWTs. You can also use this to mint your own JWTs.'
                }
                layout="horizontal"
              />
              <div className="space-y-3">
                <div className="dark:bg-bg-alt-dark bg-bg-alt-light dark:border-dark rounded-md border p-3 px-6 shadow-sm">
                  {isUpdatingJwtSecret ? (
                    <div className="flex items-center space-x-2">
                      <IconLoader className="animate-spin" size={14} />
                      <p className="text-sm">
                        Updating JWT secret: {jwtSecretUpdateProgressMessage}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col space-y-1">
                          <p>Generate a new JWT secret</p>
                          <p className="text-sm opacity-50">
                            A random secret will be created, or you can create your own.
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          {isUpdatingJwtSecret ? (
                            <Button loading type="secondary">
                              Updating JWT secret...
                            </Button>
                          ) : !canGenerateNewJWTSecret ? (
                            <Tooltip.Root delayDuration={0}>
                              <Tooltip.Trigger>
                                <Button
                                  disabled
                                  as="span"
                                  type="default"
                                  iconRight={<IconChevronDown />}
                                >
                                  Generate a new secret
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content side="bottom">
                                <Tooltip.Arrow className="radix-tooltip-arrow" />
                                <div
                                  className={[
                                    'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                                    'border-scale-200 border',
                                  ].join(' ')}
                                >
                                  <span className="text-scale-1200 text-xs">
                                    You need additional permissions to generate a new JWT secret
                                  </span>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Root>
                          ) : (
                            <Dropdown
                              align="end"
                              side="bottom"
                              overlay={
                                <>
                                  <Dropdown.Item
                                    onClick={() => setIsGeneratingKey(true)}
                                    icon={<IconRefreshCw size={16} />}
                                  >
                                    Generate a random secret
                                  </Dropdown.Item>
                                  <Dropdown.Seperator />
                                  <Dropdown.Item
                                    onClick={() => setIsCreatingKey(true)}
                                    icon={<IconPenTool size={16} />}
                                  >
                                    Create my own secret
                                  </Dropdown.Item>
                                </>
                              }
                            >
                              <Button as="span" type="default" iconRight={<IconChevronDown />}>
                                Generate a new secret
                              </Button>
                            </Dropdown>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {isJwtSecretUpdateFailed ? (
                  <Alert withIcon variant="warning" title="Failed to update JWT secret">
                    Please try again. If the failures persist, please contact Supabase support with
                    the following details: <br />
                    Change tracking ID: {changeTrackingId} <br />
                    Error message: {jwtSecretUpdateErrorMessage}
                  </Alert>
                ) : canGenerateNewJWTSecret ? (
                  <Alert
                    withIcon
                    variant="warning"
                    title="This will invalidate all existing API keys!"
                  >
                    Generating a new JWT secret will invalidate <u>all</u> of your API keys,
                    including your <code>service_role</code> and <code>anon</code> keys. Your
                    project will also be restarted during this process, which will terminate any
                    existing connections.
                  </Alert>
                ) : (
                  <></>
                )}
              </div>
            </Panel.Content>
          </Panel>
        </section>

        <section>{config && <PostgrestConfig config={config} projectRef={projectRef} />}</section>
      </div>

      <ConfirmModal
        danger
        visible={isRegeneratingKey}
        title="Are you absolutely sure?"
        description="This action cannot be undone and the old JWT secret will be lost. All existing API keys
        will be invalidated, and any open connections will be terminated."
        buttonLabel="Generate new secret"
        buttonLoadingLabel="Generating"
        onSelectCancel={() => setIsGeneratingKey(false)}
        onSelectConfirm={() => handleJwtSecretUpdate('ROLL', setIsGeneratingKey)}
      />

      <Modal
        closable
        header="Create a custom JWT secret"
        visible={isCreatingKey}
        size="medium"
        variant="danger"
        loading={isSubmittingJwtSecretUpdateRequest}
        customFooter={
          <div className="space-x-2">
            <Button type="default" onClick={() => setIsCreatingKey(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              disabled={
                customToken.length < 32 || customToken.includes('@') || customToken.includes('$')
              }
              loading={isSubmittingJwtSecretUpdateRequest}
              onClick={() => handleJwtSecretUpdate(customToken, setIsCreatingKey)}
            >
              Apply new JWT secret
            </Button>
          </div>
        }
      >
        <Modal.Content>
          <div className="space-y-2 py-4">
            <p className="text-scale-1100 text-sm">
              Create a custom JWT secret. Make sure it is a strong combination of characters that
              cannot be guessed easily.
            </p>
            <Alert
              withIcon
              variant="warning"
              title="All existing API keys will be invalidated, and any open connections will be terminated."
            />
            <Input
              onChange={(e: any) => setCustomToken(e.target.value)}
              value={customToken}
              icon={<IconKey />}
              type={showCustomTokenInput ? 'text' : 'password'}
              className="w-full text-left"
              label="Custom JWT secret"
              descriptionText="Minimally 32 characters long, '@' and '$' are not allowed."
              actions={
                <div className="mr-1 flex items-center justify-center">
                  <Button
                    type="default"
                    icon={showCustomTokenInput ? <IconEye /> : <IconEyeOff />}
                    onClick={() => setShowCustomTokenInput(!showCustomTokenInput)}
                  />
                </div>
              }
            />
          </div>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default ServiceList
