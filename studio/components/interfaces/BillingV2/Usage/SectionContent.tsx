import { PropsWithChildren } from 'react'
import { Badge, IconExternalLink } from 'ui'
import { CategoryAttribute } from './Usage.constants'
import Link from 'next/link'

export interface SectionContent {
  section: CategoryAttribute
  includedInPlan?: boolean
}

const SectionContent = ({
  section,
  includedInPlan,
  children,
}: PropsWithChildren<SectionContent>) => {
  const { name, description, links } = section

  return (
    <div className="border-b">
      <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-32 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="text-base capitalize">{name}</p>
                  {includedInPlan === false && <Badge color="gray">Not included</Badge>}
                </div>
                <div className="grid gap-4">
                  {description.split('\n').map((value, idx) => (
                    <p key={`desc-${idx}`} className="text-sm text-scale-1000 pr-8">
                      {value}
                    </p>
                  ))}
                </div>
              </div>
              {links && links.length && (
                <div className="space-y-2">
                  <p className="text-sm text-scale-1200 dark:text-scale-1100 mb-2">More information</p>
                  {links.map((link) => (
                    <div key={link.url}>
                      <Link href={link.url}>
                        <a target="_blank" rel="noreferrer">
                          <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                            <p className="text-sm">{link.name}</p>
                            <IconExternalLink size={16} strokeWidth={1.5} />
                          </div>
                        </a>
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
    </div>
  )
}

export default SectionContent
