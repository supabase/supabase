import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'

import FunctionsLayout from './interfaces/FunctionsLayout'
import {
  Button,
  IconChevronRight,
  IconExternalLink,
  IconGlobe,
  IconSearch,
  Input,
} from '@supabase/ui'
import { useState } from 'react'
import Table from 'components/to-be-cleaned/Table'
import { memoryUsage } from 'process'
import FunctionsListItem from './interfaces/FunctionsListItem'

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-scale-900">2 functions deployed</span>
        <Input icon={<IconSearch size={14} />} size="tiny" />
      </div>
      <div>
        <Table
          head={
            <>
              <Table.th>Email</Table.th>
              <Table.th>Trigger</Table.th>
              <Table.th className="hidden 2xl:table-cell">Created</Table.th>
              <Table.th className="hidden xl:table-cell">Runtime</Table.th>
              <Table.th className="hidden lg:table-cell">Memory</Table.th>
            </>
          }
          body={
            <>
              {PageState.functions.length > 0 &&
                PageState.functions.map((x: any) => <FunctionsListItem key={x.id} _function={x} />)}
            </>
          }
        />
      </div>
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

  if (pageState === 'empty') {
    return (
      <FunctionsLayout>
        <EmptyFunctions />
        <Selection />
      </FunctionsLayout>
    )
  } else {
    return (
      <FunctionsLayout>
        <FunctionsList />
        <Selection />
      </FunctionsLayout>
    )
  }
}

export default withAuth(observer(PageLayout))
