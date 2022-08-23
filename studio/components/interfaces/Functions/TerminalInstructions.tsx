import { useRouter } from 'next/router'
import { Button, IconTerminal, IconMaximize2, IconMinimize2 } from '@supabase/ui'

import { useProjectSettings } from 'hooks'
import { useAccessTokens } from 'hooks/queries/useAccessTokens'
import { Commands } from './Functions.types'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import { FC, useState } from 'react'

interface Props {
  closable?: boolean
}

const TerminalInstructions: FC<Props> = ({ closable = false }) => {
  const router = useRouter()
  const { ref } = router.query

  const { tokens } = useAccessTokens()
  const { services } = useProjectSettings(ref as string | undefined)

  const [showInstructions, setShowInstructions] = useState(!closable)

  // Get the API service
  const API_SERVICE_ID = 1
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

  const commands: Commands[] = [
    {
      command: 'supabase functions new hello-world',
      description: ' creates a function stub at ./functions/hello-world/index.ts',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions new hello-world
          </>
        )
      },
      comment: 'Create a function',
    },
    {
      command: `supabase functions deploy hello-world --project-ref ${ref}`,
      description: 'Deploys function at ./functions/hello-world/index.ts',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions deploy hello-world
            --project-ref {ref}
          </>
        )
      },
      comment: 'Deploy your function',
    },
    {
      command: `curl -L -X POST 'https://${ref}.functions.supabase.co/hello-world' -H 'Authorization: Bearer ${
        anonKey ?? '[YOUR ANON KEY]'
      }' --data '{"name":"Functions"}'`,
      description: 'Invokes the hello-world function',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">curl</span> -L -X POST 'https://{functionsEndpoint}
            /hello-world' -H 'Authorization: Bearer [YOUR ANON KEY]'{' '}
            {`--data '{"name":"Functions"}'`}
          </>
        )
      },
      comment: 'Invoke your function',
    },
  ]

  return (
    <div
      className="col-span-7 bg-scale-100 dark:bg-scale-300 shadow border rounded overflow-hidden transition-all"
      style={{ maxHeight: showInstructions ? 500 : 80 }}
    >
      <div className="px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="border p-2 flex items-center justify-center w-8 h-8 bg-scale-100 rounded">
              <IconTerminal strokeWidth={2} />
            </div>
            <h4>Terminal instructions</h4>
          </div>
          {closable && (
            <div className="cursor-pointer" onClick={() => setShowInstructions(!showInstructions)}>
              {showInstructions ? (
                <IconMinimize2 size={14} strokeWidth={1.5} />
              ) : (
                <IconMaximize2 size={14} strokeWidth={1.5} />
              )}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <CommandRender commands={commands} />
        </div>
      </div>
      {tokens && tokens.length === 0 ? (
        <div className="px-8 border-t py-6 space-y-3">
          <div>
            <h3 className="text-base text-scale-1200">You may need to create an access token</h3>
            <p className="text-sm text-scale-1100">
              You can create a secure access token in your account section
            </p>
          </div>
          <Button type="default" onClick={() => router.push('/account/tokens')}>
            Access tokens
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default TerminalInstructions
