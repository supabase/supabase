import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { Badge } from 'ui'
import { CategoryAttribute } from './Usage.constants'
import { ExternalLink } from 'lucide-react'

export interface SectionContent {
  section: Pick<CategoryAttribute, 'name' | 'description' | 'links'>
  includedInPlan?: boolean
}

const SectionContent = ({
  section,
  includedInPlan,
  children,
}: PropsWithChildren<SectionContent>) => {
  const { name, description, links } = section

  return (
    <>
      <ScaffoldContainer>
        <div className="mx-auto flex flex-col gap-10 py-16">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-5">
              <div className="sticky top-32 space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-base capitalize">{name}</p>
                    {includedInPlan === false && <Badge>Not included</Badge>}
                  </div>
                  <div className="grid gap-4">
                    {description.split('\n').map((value, idx) => (
                      <p key={`desc-${idx}`} className="text-sm text-foreground-light pr-8">
                        {value}
                      </p>
                    ))}
                  </div>
                </div>
                {links && links.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-foreground mb-2">More information</p>
                    {links.map((link) => (
                      <div key={link.url}>
                        <Link href={link.url} target="_blank" rel="noreferrer">
                          <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                            <p className="text-sm">{link.name}</p>
                            <ExternalLink size={16} strokeWidth={1.5} />
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7 space-y-6">{children}</div>
          </div>
        </div>
      </ScaffoldContainer>
      <ScaffoldDivider />
    </>
  )
}

export default SectionContent
