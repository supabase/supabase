import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'

import FunctionLayout from './../interfaces/FunctionLayout'
import {
  Button,
  Checkbox,
  Dropdown,
  IconAlertCircle,
  IconAlertOctagon,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconChevronRight,
  IconExternalLink,
  IconGlobe,
  IconSearch,
  Input,
  Popover,
  SidePanel,
} from '@supabase/ui'
import { useState } from 'react'
import Table from 'components/to-be-cleaned/Table'
import { memoryUsage } from 'process'
import FunctionsListItem from './../interfaces/FunctionsListItem'

import LogsData from './../data/logs.json'
import FunctionLogsItem from '../interfaces/FunctionLogsItem'
import dayjs from 'dayjs'
import router, { useRouter } from 'next/router'

const EmptyFunctions = () => {
  return (
    <>
      <p className="text-scale-1200 text-base max-w-lg">
        Scalable pay-as-you-go functions as a service (FaaS) to run your code with zero server
        management.
      </p>
      <p className="text-scale-1100 text-sm max-w-lg">
        No servers to provision, manage, or upgrade Automatically scale based on the load Integrated
        monitoring, logging, and debugging capability Built-in security at role and per function
        level based on the principle of least privilege Key networking capabilities for hybrid and
        multi-cloud scenarios
      </p>
      <div className="flex gap-2">
        <Button iconRight={<IconChevronRight />}>Get started</Button>
        <Button type="link" iconRight={<IconExternalLink />}>
          Documentation
        </Button>
      </div>
      <div className="bg-scale-300 rounded px-10 py-8 flex flex-col gap-8">
        <h2 className="text-sm text-scale-1100">Function examples</h2>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <div
              className="
              h-10 w-10 
              bg-indigo-900 
              bordershadow-indigo-900
              rounded-md
              text-scale-fixed-100
              flex items-center justify-center
            "
            >
              <IconGlobe />
            </div>
            <div className="">
              <h3 className="text-scale-1200">Stripe payments</h3>
              <p className="text-scale-1100">
                Charge a payment credit card when a database event occurs
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div
              className="
              h-10 w-10 
              bg-indigo-900 
              bordershadow-indigo-900
              rounded-md
              text-scale-fixed-100
              flex items-center justify-center
            "
            >
              <IconGlobe />
            </div>
            <div className="">
              <h3 className="text-scale-1200">Stripe payments</h3>
              <p className="text-scale-1100">
                Charge a payment credit card when a database event occurs
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div
              className="
              h-10 w-10 
              bg-indigo-900 
              bordershadow-indigo-900
              rounded-md
              text-scale-fixed-100
              flex items-center justify-center
            "
            >
              <IconGlobe />
            </div>
            <div className="">
              <h3 className="text-scale-1200">Stripe payments</h3>
              <p className="text-scale-1100">
                Charge a payment credit card when a database event occurs
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const FunctionsList = () => {
  const [detailVisible, setDetailVisible] = useState(false)

  const router = useRouter()
  const { ref } = router.query

  const PageState = {
    functions: [
      {
        name: 'hello-world',
        id: 1,
        runtime: 'Node14',
        memory: 256,
        created_at: 1646524256,
      },
      {
        name: 'charge',
        id: 2,
        runtime: 'Node14',
        memory: 256,
        created_at: 1646524256,
      },
      {
        name: 'projects',
        id: 3,
        runtime: 'Node14',
        memory: 512,
        created_at: 1646524256,
      },
    ],
  }

  const logDetails = (
    <div className="grid grid-cols-12 gap-2">
      <span className="col-span-3 text-sm text-scale-900 w-32">Status</span>
      <div className="col-span-7">
        <div className="flex">
          <div className="text-sm bg-scale-500 text-scale-1200 rounded px-2">200 OK</div>
        </div>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">ID</div>
      <div className="col-span-7 text-sm text-scale-1200">
        <span className="">{LogsData[0].id}</span>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">Time</div>
      <div className="col-span-7 text-sm text-scale-1200">
        <span className="">{dayjs(LogsData[0].created_at).format('DD MMM, YYYY HH:mm')}</span>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">IP Address</div>
      <div className="col-span-7 text-sm text-scale-1200">
        <span className="">{LogsData[0].ip_address}</span>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">API Version</div>
      <div className="col-span-7 text-sm text-scale-1200">
        <span className="">v0.1</span>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">Source</div>
      <div className="col-span-7 text-sm text-scale-1200">
        <span className="">Something</span>
      </div>

      {/* <div className="col-span-3 text-sm text-scale-900 w-32 grow">User agent</div>
              <div className="col-span-7 flex text-scale-1200">
                <span className="">{LogsData[0].user_agent}</span>
              </div> */}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center  justify-between gap-3">
        <div className="flex items-center gap-3">
          <Input icon={<IconSearch size={14} />} placeholder="Filter by anything.." size="tiny" />
          <div className="flex -space-x-px">
            <Button
              type="secondary"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            >
              Last Hour
            </Button>
            <Button
              type="default"
              icon={<IconCalendar />}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            >
              Custom
            </Button>
          </div>
          <Popover
            size="medium"
            align="end"
            portalled
            showClose
            side="bottom"
            header={
              <div className="flex justify-between items-center">
                <Button size="tiny" type="default">
                  Clear
                </Button>
                <h5 className="text-sm text-scale-1200">Status</h5>
                <Button type="primary">Save</Button>
              </div>
            }
            onOpenChange={function noRefCheck() {}}
            overlay={[
              <>
                <div className="py-6 space-y-4">
                  <Checkbox
                    className="px-3"
                    defaultValue="100%"
                    description="Show all 200 responses"
                    label="Succeeded"
                    size="medium"
                  />
                  <Popover.Seperator />
                  <Checkbox
                    className="px-3"
                    defaultValue="100%"
                    description="Show all 5XX responses"
                    label="Failed"
                    size="medium"
                  />
                </div>
              </>,
            ]}
          >
            <Button as="span" type="default">
              Status
            </Button>
          </Popover>
        </div>
        <Button
          type="default"
          iconRight={<IconExternalLink size={14} />}
          onClick={() =>
            router.push(
              `http://localhost:8082/project/${ref}/logs/database?q=timestamp+%3C+TIMESTAMP_SUB%28CURRENT_TIMESTAMP%28%29%2C+INTERVAL+10+MINUTE%29&s=&te=`
            )
          }
        >
          Open in logs explorer
        </Button>
      </div>
      <div className="grid grid-cols-2 h-full">
        <div>
          <Table
            head={
              <>
                <Table.th className="w-16">Response</Table.th>
                <Table.th className="w-16">Method</Table.th>
                <Table.th>URL</Table.th>
                <Table.th>Timestamp</Table.th>
              </>
            }
            body={
              <>
                {LogsData.length > 0 &&
                  LogsData.map((x: any) => (
                    <FunctionLogsItem
                      key={x.id}
                      log={x}
                      onClick={() => {
                        setDetailVisible(true)
                      }}
                    />
                  ))}
              </>
            }
          />
        </div>
        <div className="border-t border-l border-r px-6 py-4 space-y-6">
          <h3 className="text-xl font-medium text-scale-1200 mb-4">
            POST /readededeaded/functions/hello-world
          </h3>
          {logDetails}
          <SidePanel.Seperator />
          <h3 className="text-base text-scale-1200">Response body</h3>
        </div>
      </div>
      <SidePanel
        size="large"
        header={'POST /readededeaded/functions/hello-world'}
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
      >
        <div className="py-4 flex flex-col space-y-8">
          <SidePanel.Content>{logDetails}</SidePanel.Content>
          <SidePanel.Seperator />
          <SidePanel.Content>
            <h3 className="text-base text-scale-1200">Response body</h3>
          </SidePanel.Content>
        </div>
      </SidePanel>
    </div>
  )
}

const PageLayout = () => {
  const [pageState, setPageState] = useState('list')

  const Selection = () => (
    <div>
      <Button onClick={() => setPageState('empty')}>empty list</Button>
      <Button onClick={() => setPageState('list')}>list</Button>
    </div>
  )

  return (
    <FunctionLayout>
      <FunctionsList />
    </FunctionLayout>
  )
}

export default withAuth(observer(PageLayout))
