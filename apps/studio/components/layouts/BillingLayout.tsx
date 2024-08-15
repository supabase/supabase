import Link from 'next/link'
import type { PropsWithChildren } from 'react'

import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { IconX } from 'ui'

export interface BillingLayoutProps {}

const BillingLayout = ({ children }: PropsWithChildren<BillingLayoutProps>) => {
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()

  return (
    <ProjectLayout hideHeader hideIconBar>
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b py-4 px-5 border-default">
          <Link
            href={`/org/${selectedOrganization?.slug}/billing`}
            className="text-foreground-lighter transition-colors hover:text-foreground"
          >
            <IconX size={16} strokeWidth={1.5} />
          </Link>
          <div className="flex items-center space-x-6">
            <h1 className="text-sm text-foreground">Customize your plan</h1>
            <div className="h-6 w-px bg-selection"></div>
            <div className="flex items-center space-x-3">
              <p className="text-sm text-foreground-light">{selectedOrganization?.name}</p>
              <span className="text-border-stronger">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  shapeRendering="geometricPrecision"
                >
                  <path d="M16 3.549L7.12 20.600"></path>
                </svg>
              </span>
              <p className="text-sm text-foreground-light">{selectedProject?.name}</p>
            </div>
          </div>
        </div>
        <div className="overflow-auto">
          <section className="relative">{children}</section>
        </div>
      </div>
    </ProjectLayout>
  )
}

export default withAuth(BillingLayout)
