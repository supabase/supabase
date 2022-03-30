import { observer } from 'mobx-react-lite'
import { useStore, withAuth } from 'hooks'

import FunctionsLayout from './interfaces/FunctionsLayout'
import {
  Button,
  IconChevronRight,
  IconExternalLink,
  IconGlobe,
  IconSearch,
  IconTerminal,
  Input,
  Loading,
} from '@supabase/ui'
import { useEffect, useState } from 'react'
import Table from 'components/to-be-cleaned/Table'
import { memoryUsage } from 'process'
import FunctionsListItem from './interfaces/FunctionsListItem'
import { useRouter } from 'next/router'

import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { useProjectFunctionsStore } from 'stores/projectFunctionsStore'
import { toJS } from 'mobx'

const EmptyFunctions = () => {
  const router = useRouter()
  const { ref } = router.query

  interface Commands {
    command: string
    description: string
  }
  const commands: Commands[] = [
    {
      command: 'supabase init',
      description: "Needed if the project hasen't been inited before",
    },
    {
      command: 'supabase login',
      description: "Writes the user's API token to disk",
    },
    {
      command: `sudo supabase link --ref ${ref}`,
      description: `Sets the Supabase project to be associated with your project ${ref}`,
    },
    {
      command: 'supabase functions new hello',
      description: ' creates a function stub at ./functions/hello.ts',
    },
    {
      command: 'supabase functions deploy hello',
      description: 'Deploys function at ./functions/hello.ts',
    },
  ]
  return (
    <>
      <div className="grid grid-cols-2 gap-8 max-w-7xl">
        <div className="space-y-4">
          <p className="text-scale-1200 text-base max-w-lg">
            Scalable pay-as-you-go functions as a service (FaaS) to run your code with zero server
            management.
          </p>
          <p className="text-scale-1100 text-sm max-w-lg">
            No servers to provision, manage, or upgrade Automatically scale based on the load
            Integrated monitoring, logging, and debugging capability Built-in security at role and
            per function level based on the principle of least privilege Key networking capabilities
            for hybrid and multi-cloud scenarios
          </p>
          <div className="flex gap-2">
            <Button iconRight={<IconChevronRight />}>Get started</Button>
            <Button type="link" iconRight={<IconExternalLink />}>
              Documentation
            </Button>
          </div>
        </div>
        <div
          className="
      bg-scale-100 dark:bg-scale-300 px-5 py-4 
      shadow
      max-w-lg
      border rounded 
      space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="border p-2 flex items-center justify-center w-8 h-8 bg-scale-100 rounded">
              <IconTerminal strokeWidth={2} />
            </div>
            <h4>Terminal instructions</h4>
          </div>
          <div className="space-y-4">
            {commands.map((item: Commands) => {
              return (
                <>
                  <Input
                    size="small"
                    readOnly
                    value={item.command}
                    copy
                    icon={'$'}
                    descriptionText={item.description}
                  />
                  {/* <p className="text-sm text-scale-900">{item.description}</p> */}
                </>
              )
            })}
          </div>
        </div>
        <div
          className="
       col-span-2
        bg-scale-300 rounded px-10 py-8 flex flex-col gap-8"
        >
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
      </div>
    </>
  )
}

interface Function {
  id: string
  slug: string
  name: string
  version: 9
  status: 'ACTIVE' | 'INACTIVE' | 'THROTTLE'
  created_at: number
  updated_at: number
}

const FunctionsList = ({ functions }: { functions: Function[] }) => {
  // const PageState = {
  //   functions: [
  //     {
  //       name: 'hello-world',
  //       id: 1,
  //       runtime: 'Node14',
  //       memory: 256,
  //       created_at: 1646524256,
  //     },
  //     {
  //       name: 'charge',
  //       id: 2,
  //       runtime: 'Node14',
  //       memory: 256,
  //       created_at: 1646524256,
  //     },
  //     {
  //       name: 'projects',
  //       id: 3,
  //       runtime: 'Node14',
  //       memory: 512,
  //       created_at: 1646524256,
  //     },
  //   ],
  // }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-scale-900">{`${functions.length} function${
          functions.length > 1 ? 's' : ''
        } deployed`}</span>
        <Input icon={<IconSearch size={14} />} size="tiny" />
      </div>
      <div>
        <Table
          head={
            <>
              <Table.th>Name</Table.th>
              <Table.th>Trigger</Table.th>
              <Table.th>Status</Table.th>
              <Table.th className="hidden 2xl:table-cell">Created</Table.th>
              <Table.th className="hidden 2xl:table-cell">Last updated</Table.th>
              <Table.th className="hidden 2xl:table-cell">Version</Table.th>
            </>
          }
          body={
            <>
              {functions.length > 0 &&
                functions.map((item: any) => <FunctionsListItem key={item.id} function={item} />)}
            </>
          }
        />
      </div>
    </div>
  )
}

const PageLayout = () => {
  const router = useRouter()
  const { ui, functions } = useStore()

  const [pageState, setPageState] = useState('list')

  const project = ui.selectedProject

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ui.selectedProject}/restore`, {})
    }
  }, [project])

  useEffect(() => {
    functions.load()
  }, [ui.selectedProject])

  const Selection = () => (
    <div>
      <Button onClick={() => setPageState('empty')}>empty list</Button>
      <Button onClick={() => setPageState('list')}>list</Button>
    </div>
  )

  if (functions.isLoading)
    return (
      <FunctionsLayout>
        <Loading active={true}>loading</Loading>
      </FunctionsLayout>
    )

  if (functions.list().length <= 0) {
    return (
      <FunctionsLayout>
        <EmptyFunctions />
        <Selection />
      </FunctionsLayout>
    )
  } else {
    return (
      <FunctionsLayout>
        <FunctionsList functions={functions.list()} />
        <Selection />
      </FunctionsLayout>
    )
  }
}

export default withAuth(observer(PageLayout))
