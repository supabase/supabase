import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { PasswordStrengthBar } from 'components/ui/PasswordStrengthBar'
import { useDatabasePasswordResetMutation } from 'data/database/database-password-reset-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsProjectActive, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DEFAULT_MINIMUM_PASSWORD_STRENGTH } from 'lib/constants'
import { passwordStrength, PasswordStrengthScore } from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, CardContent, Input, Modal } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

const ResetDbPassword = ({ disabled = false }) => {
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

  const { mutate: resetDatabasePassword, isPending: isUpdatingPassword } =
    useDatabasePasswordResetMutation({
      onSuccess: async () => {
        toast.success('Successfully updated database password')
        setShowResetDbPass(false)
      },
    })

  useEffect(() => {
    if (showResetDbPass) {
      setPassword('')
      setPasswordStrengthMessage('')
      setPasswordStrengthWarning('')
      setPasswordStrengthScore(0)
    }
  }, [showResetDbPass])

  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  const onDbPassChange = (e: any) => {
    const value = e.target.value
    setPassword(value)
    if (value == '') {
      setPasswordStrengthScore(-1)
      setPasswordStrengthMessage('')
    } else checkPasswordStrength(value)
  }

  const confirmResetDbPass = async () => {
    if (!ref) return console.error('Project ref is required')

    if (passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
      resetDatabasePassword({ ref, password })
    }
  }

  function generatePassword() {
    const password = generateStrongPassword()
    setPassword(password)
    checkPasswordStrength(password)
  }

  return (
    <>
      <Card id="database-password">
        <CardContent>
          <FormLayout
            layout="flex-row-reverse"
            label="Database password"
            description="You can use this password to connect directly to your Postgres database."
          >
            <div className="flex items-end justify-end">
              <ButtonTooltip
                type="default"
                disabled={!canResetDbPassword || !isProjectActive || disabled}
                onClick={() => setShowResetDbPass(true)}
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
            </div>
          </FormLayout>
        </CardContent>
      </Card>
      <Modal
        hideFooter
        header={<h5 className="text-foreground">Reset database password</h5>}
        confirmText="Reset password"
        size="medium"
        visible={showResetDbPass}
        loading={isUpdatingPassword}
        onCancel={() => setShowResetDbPass(false)}
      >
        <Modal.Content className="w-full space-y-8">
          <Input
            type="password"
            value={password}
            copy={password.length > 0}
            onChange={onDbPassChange}
            error={passwordStrengthWarning}
            // @ts-ignore
            descriptionText={
              <PasswordStrengthBar
                passwordStrengthScore={passwordStrengthScore as PasswordStrengthScore}
                passwordStrengthMessage={passwordStrengthMessage}
                password={password}
                generateStrongPassword={generatePassword}
              />
            }
          />
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex items-center justify-end space-x-2">
          <Button
            type="default"
            disabled={isUpdatingPassword}
            onClick={() => setShowResetDbPass(false)}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={isUpdatingPassword}
            disabled={isUpdatingPassword}
            onClick={() => confirmResetDbPass()}
          >
            Reset password
          </Button>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default ResetDbPassword
