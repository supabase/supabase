import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { observer } from 'mobx-react-lite'

import {
  Button,
  Checkbox,
  IconCalendar,
  IconExternalLink,
  IconSearch,
  Input,
  Popover,
  SidePanel,
} from '@supabase/ui'

import { withAuth } from 'hooks'
import Table from 'components/to-be-cleaned/Table'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import FunctionLogsItem from 'components/interfaces/Functions/FunctionLogsItem'
import { LOGS_DATA } from 'components/interfaces/Functions/Functions.data'

// [Joshen] Is this supposed to be deprecated?

const FunctionsList = () => {
  const [detailVisible, setDetailVisible] = useState(false)

  const router = useRouter()
  const { ref } = router.query

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
        <span className="">{LOGS_DATA[0].id}</span>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">Time</div>
      <div className="col-span-7 text-sm text-scale-1200">
        <span className="">{dayjs(LOGS_DATA[0].created_at).format('DD MMM, YYYY HH:mm')}</span>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">IP Address</div>
      <div className="col-span-7 text-sm text-scale-1200">
        {/* 
        // @ts-ignore */}
        <span className="">{LOGS_DATA[0].ip_address}</span>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">API Version</div>
      <div className="col-span-7 text-sm text-scale-1200">
        <span className="">v0.1</span>
      </div>

      <div className="col-span-3 text-sm text-scale-900 w-32">Source</div>
      <div className="col-span-7 text-sm text-scale-1200">
        <span className="">Something</span>
      </div>
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
                {LOGS_DATA.length > 0 &&
                  LOGS_DATA.map((x: any) => (
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
  return (
    <FunctionsLayout>
      <FunctionsList />
    </FunctionsLayout>
  )
}

export default withAuth(observer(PageLayout))
