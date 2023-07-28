import CommandRender from 'components/interfaces/Functions/CommandRender'
import { useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useParams } from 'common/hooks'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FC, useState } from 'react'
import { Button, IconBookOpen, IconCode, IconMaximize2, IconMinimize2, IconTerminal } from 'ui'
import { Commands } from './Functions.types'

interface Props {
  closable?: boolean
  removeBorder?: boolean
}

const TerminalInstructions: FC<Props> = ({ closable = false, removeBorder = false }) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [showInstructions, setShowInstructions] = useState(!closable)
  const { data: tokens } = useAccessTokensQuery()
  const { data: settings } = useProjectApiQuery({ projectRef })

  const apiService = settings?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : '[YOUR ANON KEY]'
  const endpoint = settings?.autoApiService.app_config.endpoint ?? ''

  const functionsEndpoint = `${endpoint}/functions/v1`

  // get the .co or .net TLD from the restUrl
  const restUrl = settings?.autoApiService.restUrl
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : ''

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
      command: `supabase functions deploy hello-world --project-ref ${projectRef}`,
      description: 'Deploys function at ./functions/hello-world/index.ts',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions deploy hello-world
            --project-ref {projectRef}
          </>
        )
      },
      comment: 'Deploy your function',
    },
    {
      command: `curl -L -X POST 'https://${projectRef}.supabase.${restUrlTld}/functions/v1/hello-world' -H 'Authorization: Bearer ${
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
      className={`col-span-7 overflow-hidden transition-all rounded bg-scale-100 dark:bg-scale-300 ${
        removeBorder ? '' : 'border shadow'
      }`}
      style={{ maxHeight: showInstructions ? 500 : 80 }}
    >
      <div className="px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 p-2 border rounded bg-scale-100">
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
        <div>
          <CommandRender commands={commands} />
        </div>
      </div>
      {tokens && tokens.length === 0 ? (
        <div className="px-8 py-6 space-y-3 border-t">
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
        <div className="px-8 py-6 space-y-3 border-t">
          <div>
            <h3 className="text-base text-scale-1200">Need help?</h3>
            <p className="text-sm text-scale-1100">
              Read the documentation, or browse some sample code.
            </p>
          </div>
          <div className="flex gap-2">
            <Link passHref href="https://iechor.com/docs/guides/functions">
              <a target="_blank" rel="noreferrer">
                <Button type="default" iconRight={<IconBookOpen />}>
                  Documentation
                </Button>
              </a>
            </Link>
            <Link
              passHref
              href="https://github.com/openmodels-base/iechor/tree/master/examples/edge-functions/supabase/functions"
            >
              <a target="_blank" rel="noreferrer">
                <Button type="default" iconRight={<IconCode />}>
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
