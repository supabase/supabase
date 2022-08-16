import dayjs from 'dayjs'
import useSWR from 'swr'
import * as Tooltip from '@radix-ui/react-tooltip'
import { FC, useState, useRef, useEffect } from 'react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import generator from 'generate-password'
import { Typography, Input, Button, IconDownload, IconArrowRight, Tabs, Modal } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useFlag, useStore } from 'hooks'
import { get, patch } from 'lib/common/fetch'
import { pluckObjectFields, passwordStrength } from 'lib/helpers'
import { API_URL, DEFAULT_MINIMUM_PASSWORD_STRENGTH, TIME_PERIODS_INFRA } from 'lib/constants'

import { SettingsLayout } from 'components/layouts'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import Panel from 'components/ui/Panel'
import { ProjectUsageMinimal } from 'components/ui/Usage'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import ConnectionPooling from 'components/interfaces/Database/Pooling/ConnectionPooling'
import { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <div>
      <div className="content h-full w-full overflow-y-auto">
        <div className="w-full max-w-5xl px-4 py-4">
          <Usage project={project} />
          <GeneralSettings projectRef={ref} />
          <ConnectionPooling />
        </div>
      </div>
    </div>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="Database">{page}</SettingsLayout>

export default observer(ProjectSettings)

const Usage: FC<any> = ({ project }) => {
  const [dateRange, setDateRange] = useState<any>(undefined)
  const router = useRouter()
  const ref = router.query.ref as string

  return (
    <>
      <div>
        <section className="">
          <Panel
            title={
              <Typography.Title key="panel-title" level={5} className="mb-0">
                Database health
              </Typography.Title>
            }
          >
            <Panel.Content>
              <div className="mb-4 flex items-center space-x-3">
                <DateRangePicker
                  loading={false}
                  value={'3h'}
                  options={TIME_PERIODS_INFRA}
                  currentBillingPeriodStart={undefined}
                  onChange={setDateRange}
                />
                {dateRange && (
                  <div className="flex items-center space-x-2">
                    <Typography.Text type="secondary">
                      {dayjs(dateRange.period_start.date).format('MMMM D, hh:mma')}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="opacity-50">
                      <IconArrowRight size={12} />
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {dayjs(dateRange.period_end.date).format('MMMM D, hh:mma')}
                    </Typography.Text>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'ram_usage'}
                    label={'Memory usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'cpu_usage'}
                    label={'CPU usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'disk_io_budget'}
                    label={'Daily Disk IO Budget remaining'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}
              </div>
            </Panel.Content>
          </Panel>
        </section>
      </div>
      <div>
        <section className="mt-6">
          <Panel
            title={
              <Typography.Title key="panel-title" level={5} className="mb-0">
                Database storage
              </Typography.Title>
            }
          >
            <Panel.Content>
              <ProjectUsageMinimal
                projectRef={ref}
                subscription_id={project.subscription_id}
                filter={'Database'}
              />
            </Panel.Content>
          </Panel>
        </section>
      </div>
    </>
  )
}

const ResetDbPassword: FC<any> = () => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref

  const enablePermissions = useFlag('enablePermissions')
  const canResetDbPassword = enablePermissions
    ? checkPermissions(PermissionAction.UPDATE, 'projects')
    : ui.selectedOrganization?.is_owner

  const [showResetDbPass, setShowResetDbPass] = useState<boolean>(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false)

  const [password, setPassword] = useState<string>('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState<string>('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState<string>('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState<number>(0)

  useEffect(() => {
    if (showResetDbPass) {
      setIsUpdatingPassword(false)
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
    if (passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
      setIsUpdatingPassword(true)
      const res = await patch(`${API_URL}/projects/${projectRef}/db-password`, { password })
      if (!res.error) {
        ui.setNotification({ category: 'success', message: res.message })
        setShowResetDbPass(false)
      } else {
        ui.setNotification({ category: 'error', message: 'Failed to reset password' })
      }
      setIsUpdatingPassword(false)
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
      <Panel>
        <Panel.Content>
          <div className="grid grid-cols-1 items-center lg:grid-cols-2">
            <div>
              <Typography.Text className="block">Database password</Typography.Text>
              <div style={{ maxWidth: '420px' }}>
                <p className="text-sm opacity-50">
                  You can use this password to connect directly to your Postgres database.
                </p>
              </div>
            </div>
            <div className="flex items-end justify-end">
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    type="default"
                    disabled={!canResetDbPassword}
                    onClick={() => setShowResetDbPass(true)}
                  >
                    Reset Database Password
                  </Button>
                </Tooltip.Trigger>
                {!canResetDbPassword && (
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                        'border-scale-200 border ', //border
                      ].join(' ')}
                    >
                      <span className="text-scale-1200 text-xs">
                        You need additional permissions to reset the database password
                      </span>
                    </div>
                  </Tooltip.Content>
                )}
              </Tooltip.Root>
            </div>
          </div>
        </Panel.Content>
      </Panel>
      <Modal
        hideFooter
        header={<h5 className="text-scale-1200 text-sm">Reset database password</h5>}
        confirmText="Reset password"
        alignFooter="right"
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
        <Modal.Seperator />
        <Modal.Content>
          <div className="flex space-x-2 pb-2">
            <Button type="default" onClick={() => setShowResetDbPass(false)}>
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

const DownloadCertificate: FC<any> = ({ createdAt }) => {
  // instances before 3 : 08 pm sgt 29th April don't have certs installed
  if (new Date(createdAt) < new Date('2021-04-30')) return null
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod' ? 'prod' : 'staging'
  return (
    <Panel>
      <Panel.Content>
        <div className="grid grid-cols-1 items-center lg:grid-cols-2">
          <div>
            <Typography.Text className="block">SSL Connection</Typography.Text>
            <div style={{ maxWidth: '420px' }}>
              <p className="text-sm opacity-50">
                Use this certificate when connecting to your database to prevent snooping and
                man-in-the-middle attacks.
              </p>
            </div>
          </div>
          <div className="flex items-end justify-end">
            <Button type="default" icon={<IconDownload />}>
              <a
                href={`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/${env}/ssl/${env}-ca-2021.crt`}
              >
                Download Certificate
              </a>
            </Button>
          </div>
        </div>
      </Panel.Content>
    </Panel>
  )
}

const GeneralSettings: FC<any> = ({ projectRef }) => {
  const { data, error }: any = useSWR(`${API_URL}/props/project/${projectRef}/settings`, get)

  if (data?.error || error) {
    return (
      <div className="mx-auto p-6 text-center sm:w-full md:w-3/4">
        <Typography.Title level={3}>Error loading database settings</Typography.Title>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto p-6 text-center sm:w-full md:w-3/4">
        <Typography.Title level={3}>Loading...</Typography.Title>
      </div>
    )
  }

  const { project } = data
  const formModel = toJS(project)

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const connectionInfo = pluckObjectFields(formModel, DB_FIELDS)

  const uriConnString =
    `postgresql://${connectionInfo.db_user}:[YOUR-PASSWORD]@` +
    `${connectionInfo.db_host}:${connectionInfo.db_port.toString()}` +
    `/${connectionInfo.db_name}`
  const golangConnString =
    `user=${connectionInfo.db_user} password=[YOUR-PASSWORD] ` +
    `host=${connectionInfo.db_host} port=${connectionInfo.db_port.toString()}` +
    ` dbname=${connectionInfo.db_name}`
  const psqlConnString =
    `psql -h ${connectionInfo.db_host} -p ` +
    `${connectionInfo.db_port.toString()} -d ${connectionInfo.db_name} ` +
    `-U ${connectionInfo.db_user}`

  return (
    <>
      <div className="">
        <section className="mt-6 space-y-6">
          <Panel
            title={
              <Typography.Title key="panel-title" level={5} className="mb-0">
                Connection info
              </Typography.Title>
              // <Title level={4}>Connection info</Title>
            }
          >
            <Panel.Content className="space-y-6">
              <Input
                className="input-mono"
                layout="horizontal"
                readOnly
                copy
                disabled
                value={connectionInfo.db_host}
                label="Host"
              />

              <Input
                className="input-mono"
                layout="horizontal"
                readOnly
                copy
                disabled
                value={connectionInfo.db_name}
                label="Database name"
              />

              <Input
                className="input-mono"
                layout="horizontal"
                readOnly
                copy
                disabled
                value={connectionInfo.db_port.toString()}
                label="Port"
              />

              <Input
                layout="horizontal"
                className="input-mono table-input-cell text-base"
                readOnly
                copy
                disabled
                value={connectionInfo.db_user}
                label="User"
              />

              <Input
                className="input-mono"
                layout="horizontal"
                disabled
                readOnly
                value={'[The password you provided when you created this project]'}
                label="Password"
              />
            </Panel.Content>
          </Panel>
        </section>
        <ResetDbPassword />
        <DownloadCertificate createdAt={connectionInfo.inserted_at} />
      </div>
      <div>
        <section className="mt-6 space-y-6">
          <Panel
            title={
              <Typography.Title key="panel-title" level={5} className="mb-0">
                Connection string
              </Typography.Title>
            }
          >
            <Panel.Content>
              <Tabs type="underlined">
                {/* @ts-ignore */}
                <Tabs.Panel id="psql" label="PSQL">
                  <Input copy readOnly disabled value={psqlConnString} />
                </Tabs.Panel>

                {/* @ts-ignore */}
                <Tabs.Panel id="uri" label="URI">
                  <Input copy readOnly disabled value={uriConnString} />
                </Tabs.Panel>

                {/* @ts-ignore */}
                <Tabs.Panel id="golang" label="Golang">
                  <Input copy readOnly disabled value={golangConnString} />
                </Tabs.Panel>

                {/* @ts-ignore */}
                <Tabs.Panel id="jdbc" label="JDBC">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={
                      `jdbc:postgresql://${
                        connectionInfo.db_host
                      }:${connectionInfo.db_port.toString()}` +
                      `/${connectionInfo.db_name}?user=${connectionInfo.db_user}&password=[YOUR-PASSWORD]`
                    }
                  />
                </Tabs.Panel>

                {/* @ts-ignore */}
                <Tabs.Panel id="dotnet" label=".NET">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={
                      `User Id=${connectionInfo.db_user};Password=[YOUR-PASSWORD];` +
                      `Server=${
                        connectionInfo.db_host
                      };Port=${connectionInfo.db_port.toString()};` +
                      `Database=${connectionInfo.db_name}`
                    }
                  />
                </Tabs.Panel>

                {/* @ts-ignore */}
                <Tabs.Panel id="nodejs" label="Nodejs">
                  <Input copy readOnly disabled value={uriConnString} />
                </Tabs.Panel>

                {/* @ts-ignore */}
                <Tabs.Panel id="php" label="PHP">
                  <Input copy readOnly disabled value={golangConnString} />
                </Tabs.Panel>

                {/* @ts-ignore */}
                <Tabs.Panel id="python" label="Python">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={
                      `user=${connectionInfo.db_user} password=[YOUR-PASSWORD]` +
                      ` host=${connectionInfo.db_host} port=${connectionInfo.db_port.toString()}` +
                      ` database=${connectionInfo.db_name}`
                    }
                  />
                </Tabs.Panel>
              </Tabs>
            </Panel.Content>
          </Panel>
        </section>
      </div>
    </>
  )
}
