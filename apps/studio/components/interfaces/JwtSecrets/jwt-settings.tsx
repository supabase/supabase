import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  JwtSecretUpdateError,
  JwtSecretUpdateProgress,
  JwtSecretUpdateStatus,
} from '@supabase/shared-types/out/events'
import { useParams } from 'common'
import {
  AlertCircle,
  ChevronDown,
  CloudOff,
  ExternalLink,
  Hourglass,
  Key,
  Lightbulb,
  Loader2,
  PenTool,
  Power,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormInputGroupInput,
  Input_Shadcn_,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Modal,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import {
  JWT_SECRET_UPDATE_ERROR_MESSAGES,
  JWT_SECRET_UPDATE_PROGRESS_MESSAGES,
} from './jwt.constants'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FormActions } from '@/components/ui/Forms/FormActions'
import Panel from '@/components/ui/Panel'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useLegacyAPIKeysStatusQuery } from '@/data/api-keys/legacy-api-keys-status-query'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useJwtSecretUpdateMutation } from '@/data/config/jwt-secret-update-mutation'
import { useJwtSecretUpdatingStatusQuery } from '@/data/config/jwt-secret-updating-status-query'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useLegacyJWTSigningKeyQuery } from '@/data/jwt-signing-keys/legacy-jwt-signing-key-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { uuidv4 } from '@/lib/helpers'

const MAX_JWT_EXP = 604800
const formSchema = z.object({
  JWT_EXP: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({
        required_error: 'Must have a JWT expiry value',
        invalid_type_error: 'Must have a JWT expiry value',
      })
      .positive('Must be greater than 0')
      .max(MAX_JWT_EXP, `Must be less than ${MAX_JWT_EXP}`)
  ),
})
const formId = 'jwt-exp-form'

const customJwtSecretFormSchema = z.object({
  customToken: z
    .string()
    .min(32, 'Must be at least 32 characters')
    .regex(/^(?!.*[@$]).*$/, '@ and $ are not allowed'),
})
const customJwtSecretFormId = 'custom-jwt-secret-form'

const JWTSettings = () => {
  const { ref: projectRef } = useParams()

  const [customToken, setCustomToken] = useState<string>('')
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false)
  const [isRegeneratingKey, setIsGeneratingKey] = useState<boolean>(false)

  const { can: canReadJWTSecret } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'field.jwt_secret'
  )
  const { can: canGenerateNewJWTSecret } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.projects.update_jwt'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const { data } = useJwtSecretUpdatingStatusQuery({ projectRef })
  const { data: config, isError } = useProjectPostgrestConfigQuery({ projectRef })
  const { mutateAsync: updateJwt, isPending: isSubmittingJwtSecretUpdateRequest } =
    useJwtSecretUpdateMutation()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: legacyKey } = useLegacyJWTSigningKeyQuery(
    {
      projectRef,
    },
    { enabled: canReadAPIKeys }
  )
  const { data: legacyAPIKeysStatus } = useLegacyAPIKeysStatusQuery(
    { projectRef },
    { enabled: canReadAPIKeys }
  )

  const { data: authConfig, isPending: isLoadingAuthConfig } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isPending: isUpdatingAuthConfig } =
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

  const INITIAL_VALUES = useMemo(
    () => ({
      JWT_EXP: authConfig?.JWT_EXP ?? 3600,
    }),
    [authConfig]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: INITIAL_VALUES,
    resolver: zodResolver(formSchema),
  })

  const customJwtSecretForm = useForm<z.infer<typeof customJwtSecretFormSchema>>({
    defaultValues: { customToken: '' },
    resolver: zodResolver(customJwtSecretFormSchema),
  })

  const { reset, formState } = form
  const { isDirty } = formState

  useEffect(() => {
    reset(INITIAL_VALUES)
  }, [INITIAL_VALUES, reset])

  const onUpdateJwtExp: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')

    updateAuthConfig(
      { projectRef, config: values },
      {
        onError: (error) => {
          toast.error(`Failed to update JWT expiry: ${error?.message}`)
        },
        onSuccess: (newValues) => {
          toast.success('Successfully updated JWT expiry')
          reset({ JWT_EXP: newValues.JWT_EXP ?? values.JWT_EXP })
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
    } catch (error: any) {
      toast.error(`Failed to update JWT secret: ${error.message}`)
    }
  }
  return (
    <>
      <Panel
        footer={
          <div className="flex py-4 w-full">
            <FormActions
              form={formId}
              isSubmitting={isUpdatingAuthConfig}
              hasChanges={isDirty}
              handleReset={reset}
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
        <Panel.Content className="border-t border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark">
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              onSubmit={form.handleSubmit(onUpdateJwtExp)}
              className="space-y-6"
              noValidate
            >
              {isError ? (
                <div className="flex items-center justify-center py-8 space-x-2">
                  <AlertCircle size={16} strokeWidth={1.5} />
                  <p className="text-sm text-foreground-light">Failed to retrieve JWT settings</p>
                </div>
              ) : (
                <>
                  {legacyKey && legacyKey.status !== 'revoked' && (
                    <Admonition
                      type="warning"
                      title="Legacy JWT secret has been migrated to new JWT Signing Keys"
                    >
                      <p className="!leading-normal">
                        Changing the legacy JWT secret can only be done by rotating to a standby key
                        and then revoking it. It is used to{' '}
                        <em className="text-foreground not-italic">
                          {legacyKey.status === 'in_use' ? 'sign and verify' : 'only verify'}
                        </em>{' '}
                        JSON Web Tokens by Supabase products.
                      </p>

                      {legacyAPIKeysStatus && legacyAPIKeysStatus.enabled && (
                        <p className="!leading-normal">
                          <em className="text-warning not-italic">
                            This includes the <code>anon</code> and <code>service_role</code> JWT
                            based API keys.
                          </em>{' '}
                          Consider switching to publishable and secret API keys to disable them.
                        </p>
                      )}

                      <Button type="default" asChild icon={<ExternalLink className="size-4" />}>
                        <Link href={`/project/${projectRef}/settings/api-keys`}>
                          Go to API keys
                        </Link>
                      </Button>
                    </Admonition>
                  )}
                  {legacyKey && legacyKey.status === 'revoked' && (
                    <Admonition
                      type="note"
                      title="Your project has revoked the legacy JWT secret"
                      description="No new JSON Web Tokens are issued nor verified with it by Supabase products."
                    />
                  )}
                  <CardContent>
                    <FormItemLayout
                      layout="flex-row-reverse"
                      id="JWT_SECRET"
                      label={
                        legacyKey?.status === 'revoked'
                          ? 'Revoked legacy JWT secret'
                          : legacyKey
                            ? 'Legacy JWT secret (still used)'
                            : 'Legacy JWT secret'
                      }
                      description={
                        legacyKey?.status === 'revoked'
                          ? 'No longer used to sign JWTs by Supabase Auth.'
                          : !legacyKey || legacyKey.status === 'in_use'
                            ? 'Used to sign and verify JWTs issued by Supabase Auth.'
                            : 'Used only to verify JWTs.'
                      }
                    >
                      <Input
                        id="JWT_SECRET"
                        copy={canReadJWTSecret && isNotUpdatingJwtSecret}
                        reveal={canReadJWTSecret && isNotUpdatingJwtSecret}
                        readOnly
                        value={
                          !canReadJWTSecret
                            ? 'You need additional permissions to view the JWT secret'
                            : isJwtSecretUpdateFailed
                              ? 'JWT secret update failed'
                              : isUpdatingJwtSecret
                                ? 'Updating JWT secret...'
                                : config?.jwt_secret || ''
                        }
                      />
                    </FormItemLayout>
                  </CardContent>

                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="JWT_EXP"
                      disabled={!canUpdateConfig || isLoadingAuthConfig}
                      render={({ field }) => (
                        <FormItemLayout
                          name="JWT_EXP"
                          layout="flex-row-reverse"
                          label="Access token expiry time"
                          description={
                            <>
                              <div>
                                How long access tokens are valid for before a refresh token has to
                                be used.
                              </div>
                              <div>Recommendation: 3600 (1 hour).</div>
                            </>
                          }
                        >
                          <FormControl_Shadcn_>
                            <InputGroup>
                              <FormInputGroupInput
                                {...field}
                                id="JWT_EXP"
                                type="number"
                                min={0}
                                max={MAX_JWT_EXP}
                                onChange={(e) =>
                                  field.onChange(
                                    isNaN(e.target.valueAsNumber) ? '' : e.target.valueAsNumber
                                  )
                                }
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupText>seconds</InputGroupText>
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>
                </>
              )}
            </form>
          </Form_Shadcn_>
          {!legacyKey && (
            <>
              {isUpdatingJwtSecret && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin" size={14} />
                  <p className="text-sm">Updating JWT secret: {jwtSecretUpdateProgressMessage}</p>
                </div>
              )}

              {isJwtSecretUpdateFailed && (
                <Admonition type="warning" title="Failed to update JWT secret">
                  Please try again. If the failures persist, please contact Supabase support with
                  the following details: <br />
                  Change tracking ID: {data?.changeTrackingId} <br />
                  Error message: {jwtSecretUpdateErrorMessage}
                </Admonition>
              )}

              <div className="flex flex-col gap-6 border rounded-md bg p-6">
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm">How to change your JWT secret?</h4>
                  <p className="text-sm text-foreground-light">
                    Instead of changing the legacy JWT secret use a combination of the JWT Signing
                    Keys and API keys features. Consider these advantages:
                  </p>
                  <ul className="text-sm text-foreground-light list-disc list-inside">
                    <li>Zero-downtime, reversible change.</li>
                    <li>Users remain signed in and bad actors out.</li>
                    <li>
                      Create multiple secret API keys that are immediately revocable and fully
                      covered by audit logs.
                    </li>
                    <li>
                      Private keys and shared secrets are no longer visible by organization members,
                      so they can't leak.
                    </li>
                    <li>
                      Maintain tighter alignment with SOC2 and other security compliance frameworks.
                    </li>
                    <li>
                      Improve app's performance by using public keys to verify JWTs instead of
                      calling <code>getUser()</code>.
                    </li>
                  </ul>
                </div>

                <div className="flex flex-row gap-4">
                  <Button type="default" icon={<ExternalLink className="size-4" />} asChild>
                    <Link href={`/project/${projectRef}/settings/api-keys/new`}>
                      Go to API Keys
                    </Link>
                  </Button>
                  <Button type="default" icon={<ExternalLink className="size-4" />} asChild>
                    <Link href={`/project/${projectRef}/settings/jwt/signing-keys`}>
                      Go to JWT Signing Keys
                    </Link>
                  </Button>

                  <div className="grow" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <ButtonTooltip
                        disabled={!canGenerateNewJWTSecret}
                        type="default"
                        iconRight={<ChevronDown size={14} />}
                        loading={isUpdatingJwtSecret}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: !canGenerateNewJWTSecret
                              ? 'You need additional permissions to generate a new JWT secret'
                              : undefined,
                          },
                        }}
                      >
                        Change legacy JWT secret
                      </ButtonTooltip>
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
                </div>
              </div>
            </>
          )}
        </Panel.Content>
      </Panel>

      <TextConfirmModal
        variant="destructive"
        size="large"
        visible={isRegeneratingKey}
        title="Confirm legacy JWT secret change"
        confirmString="I understand and wish to proceed"
        confirmLabel={customToken ? 'Apply custom secret' : 'Generate random secret'}
        confirmPlaceholder=""
        loading={isSubmittingJwtSecretUpdateRequest}
        onCancel={() => {
          setIsGeneratingKey(false)
          setCustomToken('')
        }}
        onConfirm={() => handleJwtSecretUpdate(customToken || 'ROLL', setIsGeneratingKey)}
      >
        <ul className="space-y-4 text-sm">
          <li className="flex gap-2 bg border rounded-md p-4">
            <Lightbulb size={24} className="flex-shrink-0 text-brand" />

            <div className="flex flex-col gap-2">
              <p>Use new JWT Signing Keys and API Keys instead</p>
              <p className="text-foreground-light">
                Consider using a combination of the JWT Signing Keys and API Keys features to
                achieve the same effect.{' '}
                <em className="text-brand not-italic">
                  Some or all of the warnings listed below might not apply when using these features
                </em>
                .
              </p>
            </div>
          </li>
          <li className="flex gap-2 px-4">
            <CloudOff size={24} className="text-foreground-light flex-shrink-0" />

            <div className="flex flex-col gap-2">
              <p>Your application will experience significant downtime</p>
              <p className="text-foreground-light">
                As new <code>anon</code> and <code>service_role</code> keys will be created and the
                existing ones permanently destroyed, your application will stop functioning for the
                duration it takes you to swap them.{' '}
                <em className="text-warning not-italic">
                  If you have a mobile, desktop, CLI or any offline-capable application the downtime
                  may be more significant and dependent on app store reviews or user-initiated
                  upgrades or downloads!
                </em>
              </p>
              <p className="text-foreground-light">
                Currently active users will be forcefully signed out (inactive users will keep their
                sessions).
              </p>
              <p className="text-foreground-light">
                All long-lived Storage pre-signed URLs will be permanently invalidated.
              </p>
            </div>
          </li>

          <li className="flex gap-2 px-4">
            <Power size={24} className="text-foreground-light flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <p>Your project and database will be restarted</p>
              <p className="text-foreground-light">
                This process restarts your project, terminating existing connections to your
                database. You may see API or other unusual errors for{' '}
                <em className="text-warning not-italic">up to 2 minutes</em> while the new secret is
                deployed.
              </p>
            </div>
          </li>
          <li className="flex gap-2 px-4">
            <Hourglass size={24} className="text-foreground-light flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <p>20-minute cooldown period</p>
              <p className="text-foreground-light">
                Should you need to revert or repeat this operation, it will take at least 20 minutes
                before you're able to do so again.
              </p>
            </div>
          </li>
          <li className="flex gap-2 px-4">
            <TriangleAlert size={24} className="text-foreground-light flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <p>Irreversible change! This cannot be undone!</p>
              <p className="text-foreground-light">
                The old JWT secret will be permanently lost (unless you've saved it prior). Even if
                you use it again the <code>anon</code> and <code>service_role</code> API keys{' '}
                <em className="text-warning not-italic">will not be restorable</em> to their exact
                values.
              </p>
            </div>
          </li>
        </ul>
      </TextConfirmModal>

      <Modal
        header="Pick a new JWT secret"
        visible={isCreatingKey}
        size="medium"
        variant="danger"
        onCancel={() => {
          setIsCreatingKey(false)
          setCustomToken('')
          customJwtSecretForm.reset({ customToken: '' })
        }}
        loading={isSubmittingJwtSecretUpdateRequest}
        customFooter={
          <div className="space-x-2">
            <Button
              type="default"
              onClick={() => {
                setIsCreatingKey(false)
                setCustomToken('')
                customJwtSecretForm.reset({ customToken: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              form={customJwtSecretFormId}
              loading={isSubmittingJwtSecretUpdateRequest}
            >
              Proceed to final confirmation
            </Button>
          </div>
        }
      >
        <Modal.Content>
          <Form_Shadcn_ {...customJwtSecretForm}>
            <form
              id={customJwtSecretFormId}
              onSubmit={customJwtSecretForm.handleSubmit((values) => {
                setIsGeneratingKey(true)
                setIsCreatingKey(false)
                setCustomToken(values.customToken)
              })}
              className="flex flex-col space-y-2"
              noValidate
            >
              <p className="text-sm text-foreground-light">
                Pick a new custom JWT secret. Make sure it is a strong combination of characters
                that cannot be guessed easily.
              </p>
              <FormField_Shadcn_
                control={customJwtSecretForm.control}
                name="customToken"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Custom JWT secret"
                    description="Minimally 32 characters long, '@' and '$' are not allowed."
                  >
                    <FormControl_Shadcn_>
                      <Input copy reveal icon={<Key />} className="w-full text-left" {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default JWTSettings
