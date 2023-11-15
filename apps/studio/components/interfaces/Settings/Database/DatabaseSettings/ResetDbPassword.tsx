import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import generator from 'generate-password'
import { debounce } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { Button, Input, Modal } from 'ui'

import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import Panel from 'components/ui/Panel'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useDatabasePasswordResetMutation } from 'data/database/database-password-reset-mutation'
import { getProjectDetail } from 'data/projects/project-detail-query'
import { useCheckPermissions, useStore } from 'hooks'
import { DEFAULT_MINIMUM_PASSWORD_STRENGTH } from 'lib/constants'
import { passwordStrength } from 'lib/helpers'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

const ResetDbPassword = ({ disabled = false }) => {
  const { ref } = useParams()
  const { ui, meta } = useStore()

  const isProjectActive = useIsProjectActive()
  const { project } = useProjectContext()
  const canResetDbPassword = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const [showResetDbPass, setShowResetDbPass] = useState<boolean>(false)

  const [password, setPassword] = useState<string>('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState<string>('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState<string>('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState<number>(0)

  const { mutate: resetDatabasePassword, isLoading: isUpdatingPassword } =
    useDatabasePasswordResetMutation({
      onSuccess: async () => {
        const project = await getProjectDetail({ ref })
        if (project) meta.setProjectDetails(project)

        ui.setNotification({
          category: 'success',
          message: 'Successfully updated database password',
        })
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

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  const onDbPassChange = (e: any) => {
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

  function generateStrongPassword() {
    const password = generator.generate({
      length: 16,
      numbers: true,
      uppercase: true,
    })
    setPassword(password)
    delayedCheckPasswordStrength(password)
  }

  return (
    <>
      <Panel className="!m-0">
        <Panel.Content>
          <div
            className="grid grid-cols-1 items-center lg:grid-cols-3 scroll-mt-6"
            id="database-password"
          >
            <div className="col-span-2 space-y-1">
              <p className="block">Database password</p>
              <p className="text-sm opacity-50">
                You can use this password to connect directly to your Postgres database.
              </p>
            </div>
            <div className="flex items-end justify-end">
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    type="default"
                    disabled={!canResetDbPassword || !isProjectActive || disabled}
                    onClick={() => setShowResetDbPass(true)}
                  >
                    Reset database password
                  </Button>
                </Tooltip.Trigger>
                {(!canResetDbPassword || !isProjectActive) && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                          'border border-background', //border
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">
                          {!canResetDbPassword
                            ? 'You need additional permissions to reset the database password'
                            : !isProjectActive
                            ? 'Unable to reset database password as project is not active'
                            : ''}
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </div>
          </div>
        </Panel.Content>
      </Panel>
      <Modal
        hideFooter
        header={<h5 className="text-sm text-foreground">Reset database password</h5>}
        confirmText="Reset password"
        size="medium"
        visible={showResetDbPass}
        loading={isUpdatingPassword}
        onCancel={() => setShowResetDbPass(false)}
      >
        <Modal.Content>
          <div className="w-full space-y-8 py-8">
            <Input
              type="password"
              value={password}
              copy={password.length > 0}
              onChange={onDbPassChange}
              error={passwordStrengthWarning}
              // @ts-ignore
              descriptionText={
                <PasswordStrengthBar
                  passwordStrengthScore={passwordStrengthScore}
                  passwordStrengthMessage={passwordStrengthMessage}
                  password={password}
                  generateStrongPassword={generateStrongPassword}
                />
              }
            />
          </div>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <div className="flex items-center justify-end space-x-2 pt-1 pb-2">
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
          </div>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default ResetDbPassword
