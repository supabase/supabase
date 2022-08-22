import { observer } from 'mobx-react-lite'
import { useProjectSettings, useStore } from 'hooks'

import FunctionsLayout from 'components/layouts/FunctionsLayout'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { IconGlobe, IconTerminal } from '@supabase/ui'
import dayjs from 'dayjs'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = router.query

  const { functions, ui } = useStore()

  const [selectedFunction, setSelectedFunction] = useState<any>(null)

  useEffect(() => {
    setSelectedFunction(functions.byId(id))
  }, [functions.isLoaded, ui.selectedProject])

  const managementCommands: any = [
    {
      command: `supabase functions deploy ${selectedFunction?.slug}`,
      description: 'This will overwrite the deployed function with your new function',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions deploy{' '}
            {selectedFunction?.slug}
          </>
        )
      },
      comment: 'Deploy a new version',
    },
    {
      command: `supabase functions delete ${selectedFunction?.slug}`,
      description: 'This will remove the function and all the logs associated with it',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions delete{' '}
            {selectedFunction?.slug}
          </>
        )
      },
      comment: 'Delete the function',
    },
  ]

  const secretCommands: any = [
    {
      command: `supabase secrets list`,
      description: 'This will list all the secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> secrets list
          </>
        )
      },
      comment: 'View all secrets',
    },
    {
      command: `supabase secrets set NAME1=VALUE1 NAME2=VALUE2`,
      description: 'This will set secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> secrets set NAME1=VALUE1 NAME2=VALUE2
          </>
        )
      },
      comment: 'Set secrets for your project',
    },
    {
      command: `supabase secrets unset NAME1 NAME2 `,
      description: 'This will delete secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> secrets unset NAME1 NAME2
          </>
        )
      },
      comment: 'Unset secrets for your project',
    },
  ]

  const { services } = useProjectSettings(ref as string | undefined)

  const API_SERVICE_ID = 1

  // Get the API service
  const apiService = (services ?? []).find((x: any) => x.app.id == API_SERVICE_ID)
  const apiKeys = apiService?.service_api_keys ?? []
  const anonKey = apiKeys.find((x: any) => x.name === 'anon key')?.api_key

  const endpoint = apiService?.app_config.endpoint ?? ''
  const endpointSections = endpoint.split('.')
  const functionsEndpoint = [
    ...endpointSections.slice(0, 1),
    'functions',
    ...endpointSections.slice(1),
  ].join('.')

  const invokeCommands: any = [
    {
      command: `curl -L -X POST 'https://${ref}.functions.supabase.co/${
        selectedFunction?.slug
      }' -H 'Authorization: Bearer ${anonKey ?? '[YOUR ANON KEY]'}' --data '{"name":"Functions"}'`,
      description: 'Invokes the hello function',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">curl</span> -L -X POST 'https://{functionsEndpoint}/
            {selectedFunction?.slug}' -H 'Authorization: Bearer [YOUR ANON KEY]'{' '}
            {`--data '{"name":"Functions"}'`}
          </>
        )
      },
      comment: 'Invoke your function',
    },
  ]

  return (
    <div className="grid gap-y-4 lg:grid-cols-2 lg:gap-x-8">
      <div>
        <div
          className="
        px-10 py-8 bg-scale-100 dark:bg-scale-300 rounded border drop-shadow-sm
        space-y-6
        "
        >
          <div className="space-y-4 w-full">
            <div className="grid grid-cols-3">
              <span className="block text-scale-1000 text-sm mb-1">Function Name</span>
              <div className="text-sm text-scale-1200">{selectedFunction?.name}</div>
            </div>

            <div className="grid grid-cols-3">
              <span className="block text-scale-1000 text-sm mb-1">Status</span>
              <div className="flex flex-col gap-2 col-span-2">
                <div className="flex">
                  <div
                    className="
                    text-base bg-brand-300 dark:bg-brand-100 px-3 py-0.5 rounded-full lowercasefirst-letter
                    flex flex-row items-center gap-3 lowercase text-brand-900
              "
                  >
                    {selectedFunction?.status}
                    <div className="relative w-2 h-2">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-800 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-900"></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3">
            <span className="block text-scale-1000 text-sm mb-1 cols-span-1">Endpoint URL</span>
            <div className="col-span-2">
              <span className="text-sm text-scale-1200 break-words w-full">{`https://${ref}.functions.supabase.co/${selectedFunction?.slug}`}</span>
            </div>
          </div>

          <div className="grid grid-cols-3">
            <span className="block text-scale-1000 text-sm mb-1">Created At</span>
            <div className="text-sm text-scale-1200 col-span-2">
              {selectedFunction?.created_at &&
                dayjs(selectedFunction.created_at).format('dddd, MMMM D, YYYY h:mm A')}
            </div>
          </div>

          <div className="grid grid-cols-3">
            <span className="block text-scale-1000 text-sm mb-1">Updated At</span>
            <div className="text-sm text-scale-1200 col-span-2">
              {selectedFunction?.updated_at &&
                dayjs(selectedFunction.updated_at).format('dddd, MMMM D, YYYY h:mm A')}
            </div>
          </div>

          <div className="grid grid-cols-3">
            <span className="block text-scale-1000 text-sm mb-1">Version</span>
            <div className="text-sm text-scale-1200 col-span-2">v{selectedFunction?.version}</div>
          </div>

          <div className="grid grid-cols-3">
            <span className="block text-scale-1000 text-sm mb-1">Regions</span>
            <div className="flex flex-col gap-1 col-span-2">
              <div className="text-sm text-scale-1200 flex items-center gap-2">
                <IconGlobe />
                <span>Earth</span>
              </div>
              <span className="text-sm text-scale-1000">All functions are deployed globally</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div
          className="px-10 py-8
        bg-scale-100 dark:bg-scale-300 border drop-shadow-sm
        rounded
        space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="border p-2 flex items-center justify-center w-8 h-8 text-scale-100 dark:text-scale-1200 bg-scale-1200 dark:bg-scale-100 rounded">
              <IconTerminal strokeWidth={2} />
            </div>
            <h4>Command line access</h4>
          </div>

          <h5 className="text-base">Deployment management</h5>
          <CommandRender commands={managementCommands} />
          <h5 className="text-base">Invoke </h5>
          <CommandRender commands={invokeCommands} />
          <h5 className="text-base">Secrets management</h5>
          <CommandRender commands={secretCommands} />
        </div>
      </div>
    </div>
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
