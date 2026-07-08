import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import type { ChangeEvent, ComponentProps, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar'
import { useDatabasePasswordResetMutation } from '@/data/database/database-password-reset-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsProjectActive, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DEFAULT_MINIMUM_PASSWORD_STRENGTH } from '@/lib/constants'
import { passwordStrength, PasswordStrengthScore } from '@/lib/password-strength'
import { generateStrongPassword } from '@/lib/project'

export type ResetDbPasswordDialogProps = {
  disabled?: boolean
  onPasswordReset?: (password: string) => void
  triggerClassName?: string
  triggerIcon?: ReactNode
  triggerLabel?: string
  triggerVariant?: ComponentProps<typeof ButtonTooltip>['variant']
}

export const ResetDbPasswordDialog = ({
  disabled = false,
  onPasswordReset,
  triggerClassName,
  triggerIcon,
  triggerLabel = 'Reset password',
  triggerVariant = 'default',
}: ResetDbPasswordDialogProps) => {
  const { ref } = useParams()
  const isProjectActive = useIsProjectActive()
  const { data: project } = useSelectedProjectQuery()

  const { can: canResetDbPassword } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const [showResetDbPass, setShowResetDbPass] = useState<boolean>(false)

  const [password, setPassword] = useState<string>('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState<string>('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState<string>('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)
  const latestPasswordStrengthValueRef = useRef('')
  const passwordStrengthResultValueRef = useRef('')

  const { mutate: resetDatabasePassword, isPending: isUpdatingPassword } =
    useDatabasePasswordResetMutation({
      onSuccess: async (_data, variables) => {
        toast.success('Successfully updated database password')
        onPasswordReset?.(variables.password)
        setShowResetDbPass(false)
      },
    })

  useEffect(() => {
    if (showResetDbPass) {
      setPassword('')
      setPasswordStrengthMessage('')
      setPasswordStrengthWarning('')
      setPasswordStrengthScore(0)
      latestPasswordStrengthValueRef.current = ''
      passwordStrengthResultValueRef.current = ''
    }
  }, [showResetDbPass])

  async function checkPasswordStrength(value: string) {
    latestPasswordStrengthValueRef.current = value
    const { message, warning, strength } = await passwordStrength(value)

    if (latestPasswordStrengthValueRef.current !== value) return

    passwordStrengthResultValueRef.current = value
    setPasswordStrengthScore(strength)
    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  const onDbPassChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (value == '') {
      latestPasswordStrengthValueRef.current = value
      passwordStrengthResultValueRef.current = value
      setPasswordStrengthScore(-1)
      setPasswordStrengthMessage('')
      setPasswordStrengthWarning('')
    } else checkPasswordStrength(value)
  }

  const confirmResetDbPass = async () => {
    if (!ref) return console.error('Project ref is required')

    if (
      passwordStrengthResultValueRef.current === password &&
      passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH
    ) {
      resetDatabasePassword({ ref, password })
    }
  }

  function generatePassword() {
    const password = generateStrongPassword()
    setPassword(password)
    checkPasswordStrength(password)
  }

  return (
    <Dialog open={showResetDbPass} onOpenChange={(open) => setShowResetDbPass(open)}>
      <DialogTrigger asChild>
        <ButtonTooltip
          variant={triggerVariant}
          className={triggerClassName}
          icon={triggerIcon}
          disabled={!canResetDbPassword || !isProjectActive || disabled}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canResetDbPassword
                ? 'You need additional permissions to reset the database password'
                : !isProjectActive
                  ? 'Unable to reset database password as project is not active'
                  : undefined,
            },
          }}
        >
          {triggerLabel}
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Reset database password</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="w-full space-y-8">
          <FormItemLayout
            layout="vertical"
            isReactForm={false}
            error={passwordStrengthWarning}
            description={
              <PasswordStrengthBar
                passwordStrengthScore={passwordStrengthScore as PasswordStrengthScore}
                passwordStrengthMessage={passwordStrengthMessage}
                password={password}
                generateStrongPassword={generatePassword}
              />
            }
          >
            <Input
              copy={password.length > 0}
              aria-invalid={!!passwordStrengthWarning}
              type="password"
              placeholder="Type in a strong password"
              value={password}
              autoComplete="off"
              onChange={onDbPassChange}
            />
          </FormItemLayout>
        </DialogSection>
        <DialogFooter>
          <Button
            variant="default"
            disabled={isUpdatingPassword}
            onClick={() => setShowResetDbPass(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isUpdatingPassword}
            disabled={isUpdatingPassword}
            onClick={() => confirmResetDbPass()}
          >
            Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
