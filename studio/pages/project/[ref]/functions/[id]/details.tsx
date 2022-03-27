import { observer } from 'mobx-react-lite'
import { useStore, withAuth } from 'hooks'

import FunctionLayout from './../interfaces/FunctionLayout'
import CommandRender from '../interfaces/CommandRender'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toJS } from 'mobx'
import { IconExternalLink, IconGlobe, IconTerminal, Loading } from '@supabase/ui'
import Link from 'next/link'
import dayjs from 'dayjs'

const PageLayout = () => {
  const router = useRouter()
  const { ref, id } = router.query

  const { functions, ui } = useStore()

  const [selectedFunction, setSelectedFunction] = useState<any>(null)

  useEffect(() => {
    setSelectedFunction(functions.byId(id))
  }, [functions.isLoaded, ui.selectedProject])

  // if (!functions.isLoading) return <></>

  console.log('selected', functions.byId(id))

  const managementCommands: any = [
    {
      command: `supabase functions deploy ${selectedFunction?.name}`,
      description: 'This will overwrite the deployed function with your new function',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions deploy{' '}
            {selectedFunction?.name}
          </>
        )
      },
      comment: 'Deploy a new version',
    },
    {
      command: `supabase functions deploy ${selectedFunction?.name}`,
      description: 'This will remove the function and all the logs associated with it',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions delete{' '}
            {selectedFunction?.name}
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
      command: `supabase secrets set NAME1=VALUE NAME2=VALUE`,
      description: 'This will set secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> secrets set NAME=VALUE NAME=VALUE
          </>
        )
      },
      comment: 'Set secrets for your project',
    },
    {
      command: `supabase secrets unset NAME1 NAME2 `,
      description: 'This will deleet secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> secrets unset NAME1 NAME2
          </>
        )
      },
      comment: 'Set secrets for your project',
    },
  ]

  return (
    <FunctionLayout>
      <div className="grid gap-y-12 lg:grid-cols-2 lg:gap-x-16 py-12">
        <div>
          <div
            className="
          px-12 py-8 bg-scale-100 dark:bg-scale-300 rounded border drop-shadow-sm
          
          "
          >
            {console.log('inside the render', functions.byId(id))}
            <div>{selectedFunction?.createdAt}</div>

            <div className="space-y-4">
              <div>
                <span className="block text-scale-900 text-xs mb-1">Function name</span>
                <div className="text-base text-scale-1100">{selectedFunction?.name}</div>
              </div>

              <div>
                <span className="block text-scale-900 text-xs mb-1">Status</span>
                <div className="flex items-center gap-2">
                  <div
                    className="text-base bg-brand-300 dark:bg-brand-100 px-3 py-0.5 rounded-full lowercasefirst-letter:
                flex items-center gap-3 lowercase text-brand-900
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
                  <span className="text-xs text-scale-900">This function is running correctly</span>
                </div>
              </div>

              <div>
                <span className="block text-scale-900 text-xs mb-1">Endpoint url</span>
                <Link
                  href={`https://${ref}.functions.supabase.co/${selectedFunction?.name}`}
                  passHref
                >
                  <a
                    className="flex items-center gap-2 group text-scale-1100 hover:text-scale-1200"
                    target="_target"
                  >
                    <span className="underline">{`https://${ref}.functions.supabase.co/${selectedFunction?.name}`}</span>
                    <IconExternalLink size={14} />
                  </a>
                </Link>
              </div>

              <div>
                <span className="block text-scale-900 text-xs mb-1">Created at</span>
                <div className="text-base text-scale-1100">
                  {selectedFunction?.created_at &&
                    dayjs(selectedFunction.created_at).format('dddd, MMMM D, YYYY h:mm A')}
                </div>
              </div>

              <div>
                <span className="block text-scale-900 text-xs mb-1">Updated at</span>
                <div className="text-base text-scale-1100">
                  {selectedFunction?.updated_at &&
                    dayjs(selectedFunction.updated_at).format('dddd, MMMM D, YYYY h:mm A')}
                </div>
              </div>

              <div>
                <span className="block text-scale-900 text-xs mb-1">Version</span>
                <div className="text-base text-scale-1100">v {selectedFunction?.version}</div>
              </div>

              <div>
                <span className="block text-scale-900 text-xs mb-1">Regions</span>
                <div className="flex items-center gap-3">
                  <div className="text-base text-scale-1100 flex items-center gap-2">
                    <IconGlobe />
                    <span>Earth</span>
                  </div>
                  <span className="text-xs text-scale-900">Supabase functions run on the edge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div
            className="px-12 py-8 
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
            <h5 className="text-sm text-base">Deployment management</h5>
            <CommandRender commands={managementCommands} />
            <h5 className="text-sm text-base">Secrets management</h5>
            <CommandRender commands={secretCommands} />
          </div>
        </div>
      </div>
    </FunctionLayout>
  )
}

export default withAuth(observer(PageLayout))
