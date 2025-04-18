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
import { toast } from 'sonner'
import { number, object } from 'yup'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { useJwtSecretUpdateMutation } from 'data/config/jwt-secret-update-mutation'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { uuidv4 } from 'lib/helpers'
import {
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
  InputNumber,
  Modal,
  WarningIcon,
  Form,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  JWT_SECRET_UPDATE_ERROR_MESSAGES,
  JWT_SECRET_UPDATE_PROGRESS_MESSAGES,
} from './API.constants'
import { Admonition } from 'ui-patterns'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'

const schema = object({
  JWT_EXP: number()
    .max(604800, 'Must be less than 604800')
    .required('Must have a JWT expiry value'),
})

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
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const { data } = useJwtSecretUpdatingStatusQuery({ projectRef })
  const { data: config, isError } = useProjectPostgrestConfigQuery({ projectRef })
  const { mutateAsync: updateJwt, isLoading: isSubmittingJwtSecretUpdateRequest } =
    useJwtSecretUpdateMutation()

  const {
    data: authConfig,
    error: authConfigError,
    isLoading: isLoadingAuthConfig,
    isSuccess: isSuccessAuthConfig,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingAuthConfig } =
    useAuthConfigUpdateMutation()

  const { Failed, Updated, Updating } = JwtSecretUpdateStatus

  const isJwtSecretUpdateFailed = data?.jwtSecretUpdateStatus === Failed
  const isNotUpdatingJwtSecret =
    data?.jwtSecretUpdateStatus === undefined || data?.jwtSecretUpdateStatus === Updated
  const isUpdatingJwtSecret = data?.jwtSecretUpdateStatus === Updating
  const jwtSecretUpdateErrorMessage =
    JWT_SECRET_UPDATE_ERROR_MESSAGES[data?.jwtSecretUpdateError as JwtSecretUpdateError]
  const jwtSecretUpdateProgressMessage =
    JWT_SECRET_UPDATE_PROGRESS_MESSAGES[data?.jwtSecretUpdateProgress as JwtSecretUpdateProgress]

  const INITIAL_VALUES = {
    JWT_EXP: authConfig?.JWT_EXP ?? 3600,
  }

  const onUpdateJwtExp = async (values: any, { resetForm }: any) => {
    if (!projectRef) return console.error('Project ref is required')

    updateAuthConfig(
      { projectRef, config: values },
      {
        onError: (error) => {
          toast.error(`Failed to update JWT expiry: ${error?.message}`)
        },
        onSuccess: () => {
          toast.success('Successfully updated JWT expiry')
          resetForm({ values, initialValues: values })
        },
      }
    )
  }

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
      <Form
        id="jwt-exp-form"
        initialValues={INITIAL_VALUES}
        onSubmit={onUpdateJwtExp}
        validationSchema={schema}
        key={authConfig?.JWT_EXP}
      >
        {({ handleReset, values, initialValues }: any) => {
          const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

          return (
            <Panel
              title={<h5 className="mb-0">JWT Settings</h5>}
              footer={
                <div className="flex py-4 w-full">
                  <FormActions
                    form="jwt-exp-form"
                    isSubmitting={isUpdatingAuthConfig}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    disabled={!canUpdateConfig}
                    helper={
                      !canUpdateConfig
                        ? 'You need additional permissions to update JWT settings'
                        : undefined
                    }
                  />
                </div>
              }
            >
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

                    <InputNumber
                      id="JWT_EXP"
                      name="JWT_EXP"
                      size="small"
                      label="Access token expiry time"
                      descriptionText="How long access tokens are valid for before a refresh token has to be used. Recommendation: 3600 (1 hour)."
                      layout="horizontal"
                      actions={<span className="mr-3 text-foreground-lighter">seconds</span>}
                      disabled={!canUpdateConfig || isLoadingAuthConfig}
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
                        <Admonition type="warning" title="Failed to update JWT secret">
                          Please try again. If the failures persist, please contact Supabase support
                          with the following details: <br />
                          Change tracking ID: {data?.changeTrackingId} <br />
                          Error message: {jwtSecretUpdateErrorMessage}
                        </Admonition>
                      ) : null}
                    </div>
                  </>
                )}
              </Panel.Content>
            </Panel>
          )
        }}
      </Form>

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
