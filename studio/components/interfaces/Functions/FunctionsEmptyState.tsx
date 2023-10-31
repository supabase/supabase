import Link from 'next/link'
import { Button, IconBookOpen, IconCode } from 'ui'
import TerminalInstructions from './TerminalInstructions'

const FunctionsEmptyState = () => {
  return (
    <>
      <div className="grid max-w-7xl gap-y-12 py-12 lg:grid-cols-12 lg:gap-x-16">
        <div className="col-span-5 space-y-4">
          <p className="max-w-lg text-base text-foreground">
            Scalable functions to run your code with no server management.
          </p>
          <p className="max-w-lg text-sm text-foreground-light">
            Edge Functions are server-side Typescript functions, distributed globally at the edge -
            close to your users. They can be used for listening to webhooks or integrating your
            Supabase project with third-parties.
          </p>
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
        <TerminalInstructions />
      </div>
    </>
  )
}

export default FunctionsEmptyState
