import Link from 'next/link'
import { Button, IconBookOpen, IconCode } from 'ui'
import TerminalInstructions from './TerminalInstructions'

const FunctionsEmptyState = () => {
  return (
    <>
      <div className="grid max-w-7xl gap-y-12 py-12 lg:grid-cols-12 lg:gap-x-16">
        <div className="col-span-5 space-y-4">
          <p className="max-w-lg text-base text-scale-1200">
            Scalable functions to run your code with no server management.
          </p>
          <p className="max-w-lg text-sm text-scale-1100">
            Edge Functions are server-side Typescript functions, distributed globally at the edge -
            close to your users. They can be used for listening to webhooks or integrating your
            Supabase project with third-parties.
          </p>
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
                <Button type="default" iconRight={<IconCode />}>
                  Examples
                </Button>
              </a>
            </Link>
          </div>
        </div>
        <TerminalInstructions />
      </div>
    </>
  )
}

export default FunctionsEmptyState
