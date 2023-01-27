import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { IconGlobe, IconTerminal } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { checkPermissions, useStore } from 'hooks'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import NoPermission from 'components/ui/NoPermission'

const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = router.query

  const { functions, ui } = useStore()

  const [selectedFunction, setSelectedFunction] = useState<any>(null)

  useEffect(() => {
    setSelectedFunction(functions.byId(id))
  }, [functions.isLoaded, ui.selectedProject])

  // get the .co or .net TLD from the restUrl
  const restUrl = ui.selectedProject?.restUrl
  const restUrlTld = new URL(restUrl as string).hostname.split('.').pop()

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

  // Get the API service
  const { data: settings } = useProjectSettingsQuery({ projectRef: ref as string })
  const apiService = settings?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x: any) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : undefined

  const endpoint = apiService?.endpoint ?? ''
  const endpointSections = endpoint.split('.')
  const functionsEndpoint = [
    ...endpointSections.slice(0, 1),
    'functions',
    ...endpointSections.slice(1),
  ].join('.')

  const invokeCommands: any = [
    {
      command: `curl -L -X POST 'https://${ref}.functions.supabase.${restUrlTld}/${
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

  const canReadFunction = checkPermissions(PermissionAction.FUNCTIONS_READ, id as string)
  if (!canReadFunction) {
    return <NoPermission isFullPage resourceText="access this edge function's details" />
  }

  return (
    <div className="grid gap-y-4 lg:grid-cols-2 lg:gap-x-8">
      <div>
        <div
          className="
        space-y-6 rounded border bg-scale-100 px-10 py-8 drop-shadow-sm
        dark:bg-scale-300
        "
        >
          <div className="w-full space-y-4">
            <div className="grid grid-cols-3">
              <span className="mb-1 block text-sm text-scale-1000">Function Name</span>
              <div className="text-sm text-scale-1200">{selectedFunction?.name}</div>
            </div>

            <div className="grid grid-cols-3">
              <span className="mb-1 block text-sm text-scale-1000">Status</span>
              <div className="col-span-2 flex flex-col gap-2">
                <div className="flex">
                  <div
                    className="
                    lowercasefirst-letter flex flex-row items-center gap-3 rounded-full bg-brand-300
                    px-3 py-0.5 text-base lowercase text-brand-900 dark:bg-brand-100
              "
                  >
                    {selectedFunction?.status}
                    <div className="relative h-2 w-2">
                      <span className="flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-800 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-900"></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3">
            <span className="cols-span-1 mb-1 block text-sm text-scale-1000">Endpoint URL</span>
            <div className="col-span-2">
              <span className="w-full break-words text-sm text-scale-1200">{`https://${ref}.functions.supabase.co/${selectedFunction?.slug}`}</span>
            </div>
          </div>

          <div className="grid grid-cols-3">
            <span className="mb-1 block text-sm text-scale-1000">Created At</span>
            <div className="col-span-2 text-sm text-scale-1200">
              {selectedFunction?.created_at &&
                dayjs(selectedFunction.created_at).format('dddd, MMMM D, YYYY h:mm A')}
            </div>
          </div>

          <div className="grid grid-cols-3">
            <span className="mb-1 block text-sm text-scale-1000">Updated At</span>
            <div className="col-span-2 text-sm text-scale-1200">
              {selectedFunction?.updated_at &&
                dayjs(selectedFunction.updated_at).format('dddd, MMMM D, YYYY h:mm A')}
            </div>
          </div>

          <div className="grid grid-cols-3">
            <span className="mb-1 block text-sm text-scale-1000">Version</span>
            <div className="col-span-2 text-sm text-scale-1200">v{selectedFunction?.version}</div>
          </div>

          <div className="grid grid-cols-3">
            <span className="mb-1 block text-sm text-scale-1000">Regions</span>
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-scale-1200">
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
          className="space-y-6 rounded
        border bg-scale-100 px-10 py-8
        drop-shadow-sm
        dark:bg-scale-300"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border bg-scale-1200 p-2 text-scale-100 dark:bg-scale-100 dark:text-scale-1200">
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
