import { ExternalLink } from 'lucide-react'

import { DocsButton } from 'components/ui/DocsButton'
import { Button } from 'ui'
import TerminalInstructions from './TerminalInstructions'

const FunctionsEmptyState = () => {
  return (
    <>
      <div className="flex flex-col gap-8 w-full">
        <div className="flex flex-col gap-4">
          <p className="max-w-lg text-base text-foreground">
            Scalable functions to run your code with no server management.
          </p>
          <p className="max-w-lg text-sm text-foreground-light">
            Edge Functions are server-side Typescript functions, distributed globally at the edge -
            close to your users. They can be used for listening to webhooks or integrating your
            Supabase project with third-parties.
          </p>
          <div className="flex gap-x-2">
            <DocsButton href="https://supabase.com/docs/guides/functions" />
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions"
              >
                Examples
              </a>
            </Button>
          </div>
        </div>
        <div className="col-span-8 bg-surface-100 px-5 py-4 border rounded-md">
          <TerminalInstructions />
        </div>
      </div>
    </>
  )
}

export default FunctionsEmptyState
