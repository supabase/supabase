import { FC, useState, Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  Alert,
  Button,
  Dropdown,
  Input,
  Modal,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLoader,
  IconChevronDown,
  IconRefreshCw,
  IconPenTool,
  IconAlertCircle,
} from 'ui'
import {
  JwtSecretUpdateError,
  JwtSecretUpdateProgress,
  JwtSecretUpdateStatus,
} from '@supabase/shared-types/out/events'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { uuidv4 } from 'lib/helpers'
import {
  useStore,
  useJwtSecretUpdateStatus,
  useProjectPostgrestConfig,
  checkPermissions,
} from 'hooks'
import { API_URL } from 'lib/constants'
import {
  JWT_SECRET_UPDATE_ERROR_MESSAGES,
  JWT_SECRET_UPDATE_PROGRESS_MESSAGES,
} from './API.constants'
import Panel from 'components/ui/Panel'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { patch } from 'lib/common/fetch'

interface Props {}

const JWTSettings: FC<Props> = ({}) => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = router.query

  const [customToken, setCustomToken] = useState<string>('')
  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false)
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false)
  const [isRegeneratingKey, setIsGeneratingKey] = useState<boolean>(false)
  const [isSubmittingJwtSecretUpdateRequest, setIsSubmittingJwtSecretUpdateRequest] =
    useState<boolean>(false)

  const canReadJWTSecret = checkPermissions(PermissionAction.READ, 'field.jwt_secret')
  const canGenerateNewJWTSecret = checkPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.projects.update_jwt'
  )

  const {
    changeTrackingId,
    jwtSecretUpdateError,
    jwtSecretUpdateProgress,
    jwtSecretUpdateStatus,
    mutateJwtSecretUpdateStatus,
  }: any = useJwtSecretUpdateStatus(ref)

  const { config, isError } = useProjectPostgrestConfig(ref as string | undefined)

  const { Failed, Updated, Updating } = JwtSecretUpdateStatus

  const isJwtSecretUpdateFailed = jwtSecretUpdateStatus === Failed
  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === Updated
  const isUpdatingJwtSecret = jwtSecretUpdateStatus === Updating
  const jwtSecretUpdateErrorMessage =
    JWT_SECRET_UPDATE_ERROR_MESSAGES[jwtSecretUpdateError as JwtSecretUpdateError]
  const jwtSecretUpdateProgressMessage =
    JWT_SECRET_UPDATE_PROGRESS_MESSAGES[jwtSecretUpdateProgress as JwtSecretUpdateProgress]

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
      <Panel title={<h5 className="mb-0">JWT Settings</h5>}>
        <Panel.Content className="space-y-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
          {isError ? (
            <div className="flex items-center justify-center space-x-2 py-8">
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1100">Failed to retrieve JWT settings</p>
            </div>
          ) : (
            <>
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
                <div className="rounded-md border bg-bg-alt-light p-3 px-6 shadow-sm dark:border-dark dark:bg-bg-alt-dark">
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
                          <p className="text-sm">Generate a new JWT secret</p>
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
                                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                    'border border-scale-200',
                                  ].join(' ')}
                                >
                                  <span className="text-xs text-scale-1200">
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
                                  <Dropdown.Separator />
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
            </>
          )}
        </Panel.Content>
      </Panel>
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
            <p className="text-sm text-scale-1100">
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

export default JWTSettings
