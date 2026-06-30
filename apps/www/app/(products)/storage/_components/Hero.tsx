import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import Link from 'next/link'
import { Button } from 'ui'

export function Hero() {
  return (
    <SectionContainerWithCn>
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <h1 className="text-foreground text-3xl sm:text-5xl sm:leading-none">
            <span className="block">Store and serve</span>
            <span className="text-foreground-lighter block">any type of digital content</span>
          </h1>
          <p className="text-foreground-lighter text-sm lg:text-base">
            An open source S3 compatible storage solution with unlimited scalability, for any file
            type. With custom policies and permissions that are familiar and easy to implement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="medium">
            <Link href="https://supabase.com/dashboard">Start your project</Link>
          </Button>
          <Button asChild size="medium" variant="default">
            <Link href="/docs/guides/storage">Documentation</Link>
          </Button>
        </div>
      </div>
    </SectionContainerWithCn>
  )
}
