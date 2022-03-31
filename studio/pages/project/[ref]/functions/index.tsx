import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, IconBookOpen, IconSearch, IconTerminal, Input, Loading } from '@supabase/ui'

import { useProjectSettings, useStore, withAuth } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import Table from 'components/to-be-cleaned/Table'
import FunctionsLayout from 'components/interfaces/Functions/FunctionsLayout'
import FunctionsListItem from 'components/interfaces/Functions/FunctionsListItem'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import { Function } from 'components/interfaces/Functions/Functions.types'
import { NextPageWithLayout } from 'types'
import { useAccessTokens } from 'hooks/queries/useAccessTokens'
import useSWR from 'swr'

import { get } from 'lib/common/fetch'

const EmptyFunctions = () => {
  const router = useRouter()
  const { ref } = router.query

  const { tokens, isLoading } = useAccessTokens()
  const { services } = useProjectSettings(ref as string | undefined)

  const API_SERVICE_ID = 1

  // Get the API service
  const apiService = (services ?? []).find((x: any) => x.app.id == API_SERVICE_ID)
  const apiKeys = apiService?.service_api_keys ?? []
  const anonKey = apiKeys.find((x: any) => x.name === 'anon key')?.api_key

  interface Commands {
    command: string
    description: string
    jsx?: () => void
    comment?: string
  }
  const commands: Commands[] = [
    // {
    //   command: 'supabase init',
    //   description: "Needed if the project hasen't been inited before",
    //   jsx: () => {
    //     return (
    //       <>
    //         <span className="text-brand-1100">supabase</span> init
    //       </>
    //     )
    //   },
    //   comment: 'Initialize Supabase locally',
    // },
    // {
    //   command: 'supabase login',
    //   description: "Writes the user's API token to disk",
    //   jsx: () => {
    //     return (
    //       <>
    //         <span className="text-brand-1100">supabase</span> login
    //       </>
    //     )
    //   },
    //   comment: 'Login using your access token',
    // },
    // {
    //   command: `supabase link --ref ${ref}`,
    //   description: `Associate the current folder with your Supabase project ${ref}`,
    //   jsx: () => {
    //     return (
    //       <>
    //         <span className="text-brand-1100">supabase</span> link --ref {ref}
    //       </>
    //     )
    //   },
    //   comment: 'Link this project',
    // },
    {
      command: 'supabase functions new hello',
      description: ' creates a function stub at ./functions/hello/hello.ts',
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
      command: `supabase functions deploy hello --project-ref ${ref}`,
      description: 'Deploys function at ./functions/hello/index.ts',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions deploy hello --project-ref{' '}
            {ref}
          </>
        )
      },
      comment: 'Deploy your function',
    },
    {
      command: `curl -L -X POST 'https://${ref}.functions.supabase.co/hello' -H 'Authorization: Bearer ${
        anonKey ?? '[YOUR ANON KEY]'
      }' --data '{"name":"Functions"}'`,
      description: 'Invokes the hello function',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">curl</span> -L -X POST 'https://{ref}
            .functions.supabase.co/hello' -H 'Authorization: Bearer [YOUR ANON KEY]'{' '}
            {`--data '{"name":"Functions"}'`}
          </>
        )
      },
      comment: 'Invoke your function',
    },
  ]
  return (
    <>
      <div className="grid py-12 lg:grid-cols-12 gap-y-12 lg:gap-x-16 max-w-7xl">
        <div className="col-span-5 space-y-4">
          <p className="max-w-lg text-base text-scale-1200">
            Scalable pay-as-you-go functions as a service (FaaS) to run your code with zero server
            management.
          </p>
          <p className="max-w-lg text-sm text-scale-1100">
            No servers to provision, manage, or upgrade Automatically scale based on the load
            Integrated monitoring, logging, and debugging capability Built-in security at role and
            per function level based on the principle of least privilege Key networking capabilities
            for hybrid and multi-cloud scenarios
          </p>
          <div className="flex gap-2">
            <Link passHref href="https://supabase.com/docs/guides/functions">
              <Button as="a" type="default" iconRight={<IconBookOpen />}>
                Documentation
              </Button>
            </Link>
          </div>
        </div>
        <div
          className="
          col-span-7
      bg-scale-100 dark:bg-scale-300
      shadow
      border rounded
      "
        >
          <div className="px-8 py-6 space-y-6">
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
          {tokens && tokens.length == 0 ? (
            <div className="px-8 border-t py-6 space-y-3">
              <div>
                <h3 className="text-base text-scale-1200">
                  You may need to create an access token
                </h3>
                <p className="text-sm text-scale-1100">
                  You can create a secure access token in your account section
                </p>
              </div>
              <Button type="default" onClick={() => router.push('/account/tokens')}>
                Access tokens
              </Button>
            </div>
          ) : null}
          {/* <div className="px-8 border-t py-6">
            <Input
              value={ref}
              readOnly
              copy
              size="small"
              label="Project ref"
              descriptionText="You may need this reference when deploying a function"
            />
          </div> */}
        </div>
      </div>
    </>
  )
}

const FunctionsList = ({ functions }: { functions: Function[] }) => {
  return (
    <>
      <div className="flex flex-col gap-3 py-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-scale-900">{`${functions.length} function${
            functions.length > 1 ? 's' : ''
          } deployed`}</span>
        </div>
        <div>
          <Table
            head={
              <>
                <Table.th>Name</Table.th>
                <Table.th>URL</Table.th>
                <Table.th className="hidden lg:table-cell">Created</Table.th>
                <Table.th className="hidden 2xl:table-cell">Last updated</Table.th>
                <Table.th className="hidden 2xl:table-cell">Version</Table.th>
                <Table.th className="text-right">Status</Table.th>
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

      {/* <div
        className="flex flex-col col-span-2 gap-8 px-10 py-8 rounded bg-scale-300"
      >
        <h2 className="text-sm text-scale-1100">Function examples</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 bg-indigo-900 rounded-md bordershadow-indigo-900 text-scale-fixed-100"
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
              className="flex items-center justify-center w-10 h-10 bg-indigo-900 rounded-md bordershadow-indigo-900 text-scale-fixed-100"
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
              className="flex items-center justify-center w-10 h-10 bg-indigo-900 rounded-md bordershadow-indigo-900 text-scale-fixed-100"
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
      </div> */}
    </>
  )
}

const PageLayout: NextPageWithLayout = () => {
  const { functions } = useStore()
  const hasFunctions = functions.list().length > 0

  return hasFunctions ? <FunctionsList functions={functions.list()} /> : <EmptyFunctions />
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
