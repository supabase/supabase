import { PermissionAction } from '@supabase/shared-types/out/constants'
import { debounce } from 'lodash'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useDatabasePasswordResetMutation } from 'data/database/database-password-reset-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DEFAULT_MINIMUM_PASSWORD_STRENGTH } from 'lib/constants'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import {
  Card,
  CardHeader,
  CardContent,
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogSectionSeparator,
  DialogSection,
  DialogFooter,
  Button,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

export const ResetDbPassword = ({ disabled = false }) => {
  const { ref } = useParams()
  const isProjectActive = useIsProjectActive()
  const { data: project } = useSelectedProjectQuery()
  const { can: canResetDbPassword } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState<string>('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState<string>('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState<string>('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState<number>(0)

  const handleReset = () => {
    setPassword('')
    setPasswordStrengthMessage('')
    setPasswordStrengthWarning('')
    setPasswordStrengthScore(0)
  }

  const { mutate: resetDatabasePassword, isLoading: isUpdatingPassword } =
    useDatabasePasswordResetMutation({
      onSuccess: async () => {
        toast.success('Successfully updated database password')
        handleReset()
        setOpen(false)
      },
    })

  const checkPasswordStrength = async (value: string) => {
    const { message, warning, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  const onDbPassChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value
    setPassword(value)
    if (value == '') {
      setPasswordStrengthScore(-1)
      setPasswordStrengthMessage('')
    } else delayedCheckPasswordStrength(value)
  }

  const confirmResetDbPass = async () => {
    if (!ref) return console.error('Project ref is required')

    if (passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
      resetDatabasePassword({ ref, password })
    }
  }

  const generatePassword = () => {
    const password = generateStrongPassword()
    setPassword(password)
    delayedCheckPasswordStrength(password)
  }

  return (
    <Card>
      <CardContent id="reset-database-password">
        <FormLayout
          layout="flex-row-reverse"
          label="Database password"
          description="You can use this password to connect directly to your Postgres database."
        >
          <Dialog
            open={open}
            onOpenChange={(open) => {
              if (!open) {
                handleReset()
                setOpen(false)
              }
            }}
          >
            <DialogTrigger asChild>
              <ButtonTooltip
                type="default"
                className="w-fit self-end"
                disabled={!canResetDbPassword || !isProjectActive || disabled}
                onClick={() => setOpen(true)}
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
                Reset database password
              </ButtonTooltip>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset database password</DialogTitle>
              </DialogHeader>
              <DialogSectionSeparator />
              <DialogSection>
                <FormLayout
                  label="New Password"
                  description={
                    <PasswordStrengthBar
                      passwordStrengthScore={passwordStrengthScore}
                      passwordStrengthMessage={passwordStrengthMessage}
                      password={password}
                      generateStrongPassword={generatePassword}
                    />
                  }
                  error={passwordStrengthWarning}
                >
                  <Input
                    type="password"
                    value={password}
                    copy={password.length > 0}
                    onChange={onDbPassChange}
                  />
                </FormLayout>
              </DialogSection>
              <DialogFooter>
                <Button
                  htmlType="reset"
                  type="default"
                  disabled={isUpdatingPassword}
                  onClick={() => {
                    handleReset()
                    setOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  htmlType="submit"
                  loading={isUpdatingPassword}
                  disabled={isUpdatingPassword}
                  onClick={() => confirmResetDbPass()}
                >
                  Reset password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </FormLayout>
      </CardContent>
    </Card>
  )
}
