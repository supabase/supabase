import { Code, ExternalLink } from 'lucide-react'
import Link from 'next/link'

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
          <div className="flex gap-2">
            <Button asChild type="default" icon={<ExternalLink />}>
              <Link
                href="https://supabase.com/docs/guides/functions"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Button>
            <Button asChild type="default" icon={<Code />}>
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
        <div className="col-span-8 bg-surface-100 px-5 py-4 border rounded-md">
          <TerminalInstructions />
        </div>
      </div>
    </>
  )
}

export default FunctionsEmptyState
