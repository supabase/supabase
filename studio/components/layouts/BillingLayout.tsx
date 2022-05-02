import Link from 'next/link'
import { FC, ReactNode } from 'react'
import { useStore } from 'hooks'
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
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="py-4 border-b dark:border-dark flex items-center space-x-3 px-5">
          <Link href={`/project/${ui.selectedProject?.ref}/settings/billing`} passHref>
            <a className="transition-colors text-scale-900 hover:text-scale-1200">
              <IconX size={16} strokeWidth={1.5} />
            </a>
          </Link>
          <div className="flex items-center space-x-6">
            <h1 className="text-base text-scale-1200">Customize your plan</h1>
            <div className="h-6 w-px bg-scale-600"></div>
            <div className="flex space-x-3 items-center">
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

export default BillingLayout
