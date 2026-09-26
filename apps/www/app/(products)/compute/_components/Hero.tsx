import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import Link from 'next/link'
import { Badge, Button } from 'ui'

export function Hero() {
  return (
    <SectionContainerWithCn spacing="sections">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 -mt-8">
          <Badge variant="warning">Private Alpha</Badge>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <h1 className="text-foreground text-3xl sm:text-5xl sm:leading-none">
            <span className="flex items-center gap-3">Compute</span>
            <span className="text-foreground-lighter block">for agentic workloads</span>
          </h1>
          <p className="text-foreground-lighter text-sm lg:text-base text-balance">
            Agent sandboxes and always-on backend services running inside your Supabase project —
            next to your data, behind your auth.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 lg:mt-4">
          <Button asChild size="medium">
            <Link href="#waitlist">Join the waitlist</Link>
          </Button>
          <Button asChild size="medium" variant="outline">
            <Link href="#waitlist">View announcement</Link>
          </Button>
        </div>
      </div>
    </SectionContainerWithCn>
  )
}
