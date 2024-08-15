import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  JwtSecretUpdateError,
  JwtSecretUpdateProgress,
  JwtSecretUpdateStatus,
} from '@supabase/shared-types/out/events'
import {
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Key,
  Loader2,
  PenTool,
  RefreshCw,
} from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { useJwtSecretUpdateMutation } from 'data/config/jwt-secret-update-mutation'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { uuidv4 } from 'lib/helpers'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Modal,
  WarningIcon,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  JWT_SECRET_UPDATE_ERROR_MESSAGES,
  JWT_SECRET_UPDATE_PROGRESS_MESSAGES,
} from './API.constants'

const JWTSettings = () => {
  const { ref: projectRef } = useParams()

  const [customToken, setCustomToken] = useState<string>('')
  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false)
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false)
  const [isRegeneratingKey, setIsGeneratingKey] = useState<boolean>(false)

  const canReadJWTSecret = useCheckPermissions(PermissionAction.READ, 'field.jwt_secret')
  const canGenerateNewJWTSecret = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.projects.update_jwt'
  )

  const { data } = useJwtSecretUpdatingStatusQuery({ projectRef })
  const { data: config, isError } = useProjectPostgrestConfigQuery({ projectRef })
  const { mutateAsync: updateJwt, isLoading: isSubmittingJwtSecretUpdateRequest } =
    useJwtSecretUpdateMutation()

  const { Failed, Updated, Updating } = JwtSecretUpdateStatus

  const isJwtSecretUpdateFailed = data?.jwtSecretUpdateStatus === Failed
  const isNotUpdatingJwtSecret =
    data?.jwtSecretUpdateStatus === undefined || data?.jwtSecretUpdateStatus === Updated
  const isUpdatingJwtSecret = data?.jwtSecretUpdateStatus === Updating
  const jwtSecretUpdateErrorMessage =
    JWT_SECRET_UPDATE_ERROR_MESSAGES[data?.jwtSecretUpdateError as JwtSecretUpdateError]
  const jwtSecretUpdateProgressMessage =
    JWT_SECRET_UPDATE_PROGRESS_MESSAGES[data?.jwtSecretUpdateProgress as JwtSecretUpdateProgress]

  async function handleJwtSecretUpdate(
    jwt_secret: string,
    setModalVisibility: Dispatch<SetStateAction<boolean>>
  ) {
    if (!projectRef) return console.error('Project ref is required')
    const trackingId = uuidv4()
    try {
      await updateJwt({ projectRef, jwtSecret: jwt_secret, changeTrackingId: trackingId })
      setModalVisibility(false)
      toast(
        'Successfully submitted JWT secret update request. Please wait while your project is updated.'
      )
    } catch (error) {}
  }

  return (
    <>
      <Panel title={<h5 className="mb-0">JWT Settings</h5>}>
        <Panel.Content className="space-y-6 border-t border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark">
          {isError ? (
            <div className="flex items-center justify-center py-8 space-x-2">
              <AlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-foreground-light">Failed to retrieve JWT settings</p>
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
                <div className="p-3 px-6 border rounded-md shadow-sm bg-studio">
                  {isUpdatingJwtSecret ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="animate-spin" size={14} />
                      <p className="text-sm">
                        Updating JWT secret: {jwtSecretUpdateProgressMessage}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between w-full">
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
                            <ButtonTooltip
                              disabled
                              type="default"
                              iconRight={<ChevronDown size={14} />}
                              tooltip={{
                                content: {
                                  side: 'bottom',
                                  text: 'You need additional permissions to generate a new JWT secret',
                                },
                              }}
                            >
                              Generate a new secret
                            </ButtonTooltip>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="default" iconRight={<ChevronDown size={14} />}>
                                  <span>Generate a new secret</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" side="bottom">
                                <DropdownMenuItem
                                  className="space-x-2"
                                  onClick={() => setIsGeneratingKey(true)}
                                >
                                  <RefreshCw size={16} />
                                  <p>Generate a random secret</p>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="space-x-2"
                                  onClick={() => setIsCreatingKey(true)}
                                >
                                  <PenTool size={16} />
                                  <p>Create my own secret</p>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                    Change tracking ID: {data?.changeTrackingId} <br />
                    Error message: {jwtSecretUpdateErrorMessage}
                  </Alert>
                ) : null}
              </div>
            </>
          )}
        </Panel.Content>
      </Panel>

      <ConfirmationModal
        variant={'destructive'}
        size="medium"
        visible={isRegeneratingKey}
        title="Confirm to generate a new JWT secret"
        confirmLabel="Generate new secret"
        confirmLabelLoading="Generating"
        onCancel={() => setIsGeneratingKey(false)}
        onConfirm={() => handleJwtSecretUpdate('ROLL', setIsGeneratingKey)}
        alert={{
          title: 'This will invalidate all existing API keys',
          description: (
            <>
              Generating a new JWT secret will invalidate <u className="text-foreground">all</u> of
              your API keys, including your <code className="text-xs">service_role</code> and{' '}
              <code className="text-xs">anon</code> keys. Your project will also be restarted during
              this process, which will terminate any existing connections. You may receive API
              errors for up to 2 minutes while the new secret is deployed.
            </>
          ),
        }}
      >
        <p className="text-foreground text-sm">
          This action cannot be undone and the old JWT secret will be lost. All existing API keys
          will be invalidated, and any open connections will be terminated.
        </p>
      </ConfirmationModal>

      <Modal
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
        <Modal.Content className="space-y-2">
          <p className="text-sm text-foreground-light">
            Create a custom JWT secret. Make sure it is a strong combination of characters that
            cannot be guessed easily.
          </p>
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>This will invalidate all existing API keys</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Generating a new JWT secret will invalidate <u className="text-foreground">all</u> of
              your API keys, including your <code className="text-xs">service_role</code> and{' '}
              <code className="text-xs">anon</code> keys. Your project will also be restarted during
              this process, which will terminate any existing connections.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
          <Input
            onChange={(e: any) => setCustomToken(e.target.value)}
            value={customToken}
            icon={<Key />}
            type={showCustomTokenInput ? 'text' : 'password'}
            className="w-full text-left"
            label="Custom JWT secret"
            descriptionText="Minimally 32 characters long, '@' and '$' are not allowed."
            actions={
              <div className="flex items-center justify-center mr-1">
                <Button
                  type="default"
                  icon={showCustomTokenInput ? <Eye /> : <EyeOff />}
                  onClick={() => setShowCustomTokenInput(!showCustomTokenInput)}
                />
              </div>
            }
          />
        </Modal.Content>
      </Modal>
    </>
  )
}

export default JWTSettings
