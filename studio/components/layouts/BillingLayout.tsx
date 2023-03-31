import Link from 'next/link'
import { FC, ReactNode } from 'react'
import { useStore, withAuth } from 'hooks'
import { observer } from 'mobx-react-lite'
import { IconX } from 'ui'

import BaseLayout from 'components/layouts'

interface Props {
  children: ReactNode
}

const BillingLayout: FC<Props> = ({ children }) => {
  const { ui } = useStore()

  return (
    <BaseLayout hideHeader hideIconBar>
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b py-4 px-5 dark:border-dark">
          <Link href={`/project/${ui.selectedProject?.ref}/settings/billing/subscription`} passHref>
            <a className="text-scale-900 transition-colors hover:text-scale-1200">
              <IconX size={16} strokeWidth={1.5} />
            </a>
          </Link>
          <div className="flex items-center space-x-6">
            <h1 className="text-sm text-scale-1200">Customize your plan</h1>
            <div className="h-6 w-px bg-scale-600"></div>
            <div className="flex items-center space-x-3">
              <p className="text-sm text-scale-1100">{ui.selectedOrganization?.name}</p>
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
              <p className="text-sm text-scale-1100">{ui.selectedProject?.name}</p>
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

export default withAuth(observer(BillingLayout))
