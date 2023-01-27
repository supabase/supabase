import { useRouter } from 'next/router'
import { Button, IconTerminal, IconMaximize2, IconMinimize2, IconBookOpen, IconCode } from 'ui'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useAccessTokens } from 'hooks/queries/useAccessTokens'
import { Commands } from './Functions.types'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import { FC, useState } from 'react'
import { useStore } from 'hooks'
import Link from 'next/link'

interface Props {
  closable?: boolean
}

const TerminalInstructions: FC<Props> = ({ closable = false }) => {
  const router = useRouter()
  const { ref } = router.query
  const { ui } = useStore()

  const { tokens } = useAccessTokens()
  const { data: settings } = useProjectSettingsQuery({ projectRef: ref as string })

  const [showInstructions, setShowInstructions] = useState(!closable)

  // Get the API service
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

  // get the .co or .net TLD from the restUrl
  const restUrl = ui.selectedProject?.restUrl
  const restUrlTld = new URL(restUrl as string).hostname.split('.').pop()

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
      command: `curl -L -X POST 'https://${ref}.functions.supabase.${restUrlTld}/hello-world' -H 'Authorization: Bearer ${
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
      className="col-span-7 overflow-hidden rounded border bg-scale-100 shadow transition-all dark:bg-scale-300"
      style={{ maxHeight: showInstructions ? 500 : 80 }}
    >
      <div className="space-y-6 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border bg-scale-100 p-2">
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
        <div className="space-y-3 border-t px-8 py-6">
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
      ) : (
        <div className="space-y-3 border-t px-8 py-6">
          <div>
            <h3 className="text-base text-scale-1200">Need help?</h3>
            <p className="text-sm text-scale-1100">
              Read the documentation, or browse some sample code.
            </p>
          </div>
          <div className="flex gap-2">
            <Link passHref href="https://supabase.com/docs/guides/functions">
              <a target="_blank" rel="noreferrer">
                <Button type="default" iconRight={<IconBookOpen />}>
                  Documentation
                </Button>
              </a>
            </Link>
            <Link
              passHref
              href="https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions"
            >
              <a target="_blank" rel="noreferrer">
                <Button as="a" type="default" iconRight={<IconCode />}>
                  Examples
                </Button>
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default TerminalInstructions
