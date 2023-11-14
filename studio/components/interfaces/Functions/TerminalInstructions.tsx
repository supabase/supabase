import { useParams } from 'common/hooks'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, IconBookOpen, IconCode, IconMaximize2, IconMinimize2, IconTerminal } from 'ui'

import CommandRender from 'components/interfaces/Functions/CommandRender'
import { useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { Commands } from './Functions.types'

interface TerminalInstructionsProps {
  closable?: boolean
  removeBorder?: boolean
}

const TerminalInstructions = ({
  closable = false,
  removeBorder = false,
}: TerminalInstructionsProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [showInstructions, setShowInstructions] = useState(!closable)

  const { data: tokens } = useAccessTokensQuery()
  const { data: settings } = useProjectApiQuery({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })

  const apiService = settings?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : '[YOUR ANON KEY]'
  const endpoint = settings?.autoApiService.app_config.endpoint ?? ''

  const functionsEndpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}/functions/v1`
      : `https://${endpoint}/functions/v1`

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
            <span className="text-brand-600">supabase</span> functions new hello-world
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
            <span className="text-brand-600">supabase</span> functions deploy hello-world
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
            <span className="text-brand-600">curl</span> -L -X POST '{functionsEndpoint}
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
      className={`col-span-7 overflow-hidden transition-all rounded bg-surface-100 ${
        removeBorder ? '' : 'border shadow'
      }`}
      style={{ maxHeight: showInstructions ? 500 : 80 }}
    >
      <div className="px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 p-2 border rounded bg-alternative">
              <IconTerminal strokeWidth={2} />
            </div>
            <h4>Create your first Edge Function via the CLI</h4>
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
            <h3 className="text-base text-foreground">You may need to create an access token</h3>
            <p className="text-sm text-foreground-light">
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
            <h3 className="text-base text-foreground">Need help?</h3>
            <p className="text-sm text-foreground-light">
              Read the documentation, or browse some sample code.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild type="default" iconRight={<IconBookOpen />}>
              <Link
                href="https://supabase.com/docs/guides/functions"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Button>
            <Button asChild type="default" iconRight={<IconCode />}>
              <Link
                href="https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions"
                target="_blank"
                rel="noreferrer"
              >
                Examples
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TerminalInstructions
