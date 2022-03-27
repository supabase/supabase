import { observer } from 'mobx-react-lite'
import { useStore, withAuth } from 'hooks'

import FunctionsLayout from './interfaces/FunctionsLayout'
import {
  Button,
  IconBookOpen,
  IconChevronRight,
  IconClipboard,
  IconCopy,
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
import CommandRender from './interfaces/CommandRender'
import Link from 'next/link'

import { Function } from './interfaces/Functions.types'

const EmptyFunctions = () => {
  const router = useRouter()
  const { ref } = router.query

  interface Commands {
    command: string
    description: string
    jsx?: () => void
    comment?: string
  }
  const commands: Commands[] = [
    {
      command: 'Run supabase ',
      description: "Needed if the project hasen't been inited before",
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> init
          </>
        )
      },
      comment: 'Initialize Supabase locally',
    },
    {
      command: 'Login to supabase',
      description: "Writes the user's API token to disk",
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> login
          </>
        )
      },
      comment: 'Login using your access token',
    },
    {
      command: `sudo supabase link --ref ${ref}`,
      description: `Sets the Supabase project to be associated with your project ${ref}`,
      jsx: () => {
        return (
          <>
            sudo <span className="text-brand-1100">supabase</span> link --ref {ref}
          </>
        )
      },
      comment: 'Link this project',
    },
    {
      command: 'supabase functions new hello',
      description: ' creates a function stub at ./functions/hello.ts',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions new hello
          </>
        )
      },
      comment: 'Create a function',
    },
    {
      command: 'supabase functions deploy hello',
      description: 'Deploys function at ./functions/hello.ts',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions deploy hello
          </>
        )
      },
      comment: 'Deploy your function',
    },
  ]
  return (
    <>
      <div className="grid lg:grid-cols-12 gap-y-12 lg:gap-x-16 max-w-7xl py-12">
        <div className="space-y-4 col-span-5">
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
            <Link passHref href="https://supabase.com/docs/functions">
              <Button as="a" type="default" iconRight={<IconBookOpen />}>
                Documentation
              </Button>
            </Link>
          </div>
        </div>
        <div
          className="
          col-span-7
      bg-scale-100 dark:bg-scale-300 px-8 py-6 
      shadow
      
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
            <CommandRender commands={commands} />
          </div>
        </div>
      </div>
    </>
  )
}

const FunctionsList = ({ functions }: { functions: Function[] }) => {
  return (
    <>
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
    </>
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
    // if (true) {
    return (
      <FunctionsLayout centered={true}>
        <EmptyFunctions />
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
