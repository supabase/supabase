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
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionDescription,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

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
      <PageSection id="database-password">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Database password</PageSectionTitle>

            <PageSectionDescription>Used for direct Postgres connections</PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent className="flex flex-row items-center gap-x-2 justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm text-foreground">Reset database password</h3>
                <p className="text-sm text-foreground-light text-balance">
                  The database password isn’t viewable after creation. Resetting it will break any
                  existing connections.
                </p>
              </div>

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
                Reset password
              </ButtonTooltip>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
      <Modal
        hideFooter
        header="Reset database password"
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
