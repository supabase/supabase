import Link from 'next/link'
import { PropsWithChildren } from 'react'

import BaseLayout from 'components/layouts'
import { useSelectedOrganization, useSelectedProject, withAuth } from 'hooks'
import { IconX } from 'ui'

export interface BillingLayoutProps {}

const BillingLayout = ({ children }: PropsWithChildren<BillingLayoutProps>) => {
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()

  return (
    <BaseLayout hideHeader hideIconBar>
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b py-4 px-5 dark:border-dark">
          <Link href={`/project/${selectedProject?.ref}/settings/billing/subscription`} passHref>
            <a className="text-scale-900 transition-colors hover:text-scale-1200">
              <IconX size={16} strokeWidth={1.5} />
            </a>
          </Link>
          <div className="flex items-center space-x-6">
            <h1 className="text-sm text-scale-1200">Customize your plan</h1>
            <div className="h-6 w-px bg-scale-600"></div>
            <div className="flex items-center space-x-3">
              <p className="text-sm text-scale-1100">{selectedOrganization?.name}</p>
              <span className="text-scale-800">
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
              <p className="text-sm text-scale-1100">{selectedProject?.name}</p>
            </div>
          </div>
        </div>
        <div className="overflow-auto">
          <section className="relative">{children}</section>
        </div>
      </div>
    </BaseLayout>
  )
}

export default withAuth(BillingLayout)
