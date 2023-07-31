import { FC } from 'react'
import { useRouter } from 'next/router'
import { Input, Tabs } from 'ui'
import { pluckObjectFields } from 'lib/helpers'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'

import { useParams, useTelemetryProps } from 'common'
import Telemetry from 'lib/telemetry'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import ResetDbPassword from './ResetDbPassword'

const DatabaseSettings = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const telemetryProps = useTelemetryProps()
  const { data, isLoading, isError } = useProjectSettingsQuery({ projectRef })

  if (isError) {
    return (
      <div className="mx-auto p-6 text-center sm:w-full md:w-3/4">
        <p className="text-scale-1000">Error loading database settings</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-10">
        <section className="space-y-6">
          <h3 className="text-scale-1200 mb-2 text-xl">Database Settings</h3>
          <Panel
            title={
              <h5 key="panel-title" className="mb-0">
                Connection info
              </h5>
            }
            className="!m-0"
          >
            <Panel.Content className="space-y-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="grid gap-2 items-center md:grid md:grid-cols-12 md:gap-x-4 w-full"
                >
                  <ShimmeringLoader className="h-4 w-1/3 col-span-4" delayIndex={i} />
                  <ShimmeringLoader className="h-8 w-full col-span-8" delayIndex={i} />
                </div>
              ))}
            </Panel.Content>
          </Panel>
        </section>

        <ResetDbPassword disabled />

        <section className="space-y-6">
          <Panel
            title={
              <h5 key="panel-title" className="mb-0">
                Connection string
              </h5>
            }
            className="!m-0"
          >
            <Panel.Content>
              <Tabs type="underlined" size="small">
                <Tabs.Panel id="psql" label="PSQL">
                  <ShimmeringLoader className="h-8 w-full" />
                </Tabs.Panel>

                <Tabs.Panel id="uri" label="URI">
                  <ShimmeringLoader className="h-8 w-full" />
                </Tabs.Panel>

                <Tabs.Panel id="golang" label="Golang">
                  <ShimmeringLoader className="h-8 w-full" />
                </Tabs.Panel>

                <Tabs.Panel id="jdbc" label="JDBC">
                  <ShimmeringLoader className="h-8 w-full" />
                </Tabs.Panel>

                <Tabs.Panel id="dotnet" label=".NET">
                  <ShimmeringLoader className="h-8 w-full" />
                </Tabs.Panel>

                <Tabs.Panel id="nodejs" label="Nodejs">
                  <ShimmeringLoader className="h-8 w-full" />
                </Tabs.Panel>

                <Tabs.Panel id="php" label="PHP">
                  <ShimmeringLoader className="h-8 w-full" />
                </Tabs.Panel>

                <Tabs.Panel id="python" label="Python">
                  <ShimmeringLoader className="h-8 w-full" />
                </Tabs.Panel>
              </Tabs>
            </Panel.Content>
          </Panel>
        </section>
      </div>
    )
  }

  const { project } = data

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const connectionInfo = pluckObjectFields(project, DB_FIELDS)

  const handleCopy = (labelValue?: string) =>
    Telemetry.sendEvent(
      {
        category: 'settings',
        action: 'copy_connection_string',
        label: labelValue ? labelValue : '',
      },
      telemetryProps,
      router
    )
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
    <div className="space-y-10">
      <section className="space-y-6">
        <h3 className="text-scale-1200 mb-2 text-xl">Database Settings</h3>
        <Panel
          title={
            <h5 key="panel-title" className="mb-0">
              Connection info
            </h5>
          }
          className="!m-0"
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
              onCopy={() => {
                handleCopy('Host')
              }}
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

      <section className="space-y-6">
        <Panel
          title={
            <h5 key="panel-title" className="mb-0">
              Connection string
            </h5>
          }
          className="!m-0"
        >
          <Panel.Content>
            <Tabs type="underlined" size="small">
              <Tabs.Panel id="psql" label="PSQL">
                <Input
                  copy
                  readOnly
                  disabled
                  value={psqlConnString}
                  onCopy={() => {
                    handleCopy('PSQL')
                  }}
                />
              </Tabs.Panel>

              <Tabs.Panel id="uri" label="URI">
                <Input
                  copy
                  readOnly
                  disabled
                  value={uriConnString}
                  onCopy={() => {
                    handleCopy('URI')
                  }}
                />
              </Tabs.Panel>

              <Tabs.Panel id="golang" label="Golang">
                <Input
                  copy
                  readOnly
                  disabled
                  value={golangConnString}
                  onCopy={() => {
                    handleCopy('Golang')
                  }}
                />
              </Tabs.Panel>

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
                  onCopy={() => {
                    handleCopy('JDBC')
                  }}
                />
              </Tabs.Panel>

              <Tabs.Panel id="dotnet" label=".NET">
                <Input
                  copy
                  readOnly
                  disabled
                  value={
                    `User Id=${connectionInfo.db_user};Password=[YOUR-PASSWORD];` +
                    `Server=${connectionInfo.db_host};Port=${connectionInfo.db_port.toString()};` +
                    `Database=${connectionInfo.db_name}`
                  }
                  onCopy={() => {
                    handleCopy('.NET')
                  }}
                />
              </Tabs.Panel>

              <Tabs.Panel id="nodejs" label="Nodejs">
                <Input
                  copy
                  readOnly
                  disabled
                  value={uriConnString}
                  onCopy={() => {
                    handleCopy('Nodejs')
                  }}
                />
              </Tabs.Panel>

              <Tabs.Panel id="php" label="PHP">
                <Input
                  copy
                  readOnly
                  disabled
                  value={golangConnString}
                  onCopy={() => {
                    handleCopy('PHP')
                  }}
                />
              </Tabs.Panel>

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
                  onCopy={() => {
                    handleCopy('Python')
                  }}
                />
              </Tabs.Panel>
            </Tabs>
          </Panel.Content>
        </Panel>
      </section>
    </div>
  )
}

export default DatabaseSettings
