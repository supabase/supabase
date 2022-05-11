import Link from 'next/link'
import { FC, ReactNode } from 'react'
import { useStore, withAuth } from 'hooks'
import { Button, IconX } from '@supabase/ui'

import { headWithTimeout } from 'lib/common/fetch'
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
        <div className="dark:border-dark flex items-center space-x-3 border-b py-4 px-5">
          <Link href={`/project/${ui.selectedProject?.ref}/settings/billing`} passHref>
            <a className="text-scale-900 hover:text-scale-1200 transition-colors">
              <IconX size={16} strokeWidth={1.5} />
            </a>
          </Link>
          <div className="flex items-center space-x-6">
            <h1 className="text-scale-1200 text-base">Customize your plan</h1>
            <div className="bg-scale-600 h-6 w-px"></div>
            <div className="flex items-center space-x-3">
              <p className="text-scale-1100 text-sm">{ui.selectedOrganization?.name}</p>
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
              <p className="text-scale-1100 text-sm">{ui.selectedProject?.name}</p>
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
