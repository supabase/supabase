import Link from 'next/link'
import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface PartnerResourceProps {
  title: string
  description: string
  href: string
  linkText: string
}

export function PartnerResource({ title, description, href, linkText }: PartnerResourceProps) {
  return (
    <SectionContainer>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-xl bg-surface-100 border">
        <div>
          <h3 className="text-xl font-medium">{title}</h3>
          <p className="text-foreground-lighter mt-1">{description}</p>
        </div>
        <Button asChild type="default">
          <Link href={href}>{linkText}</Link>
        </Button>
      </div>
    </SectionContainer>
  )
}

