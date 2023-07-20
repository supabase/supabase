import { FC } from 'react'
import Link from 'next/link'
import { IconChevronRight, IconX, cn } from 'ui'
import { withAuth, useFlag } from 'hooks'
import { observer } from 'mobx-react-lite'
import { BASE_PATH } from 'lib/constants'
import React from 'react'
import { ScaffoldContainer } from './Scaffold'
import { useParams } from 'common'

const IntegrationWindowLayout: FC<any> = ({ organization, project, children }) => {
  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  return (
    <div className="flex w-full flex-col" style={{ height: maxHeight, maxHeight }}>
      <Header organization={organization} project={project} />
      {children}
    </div>
  )
}

const INTEGRATION_LAYOUT_MAX_WIDTH = '' // 'max-w-[720px]'

export default withAuth(observer(IntegrationWindowLayout))

export const IntegrationWindowLayoutWithoutAuth = observer(IntegrationWindowLayout)

const Header: FC<any> = ({ organization, project }) => {
  let stepNumber = organization ? 1 : project ? 2 : 0
  const { externalId } = useParams()

  const title = externalId
    ? 'Supabase + Vercel Deploy Button'
    : 'Supabase + Vercel Integration Marketplace Connector'

  return (
    <div className="bg">
      <ScaffoldContainer className={cn('py-3', INTEGRATION_LAYOUT_MAX_WIDTH)}>
        <div className="flex items-center gap-6 w-full">
          <div className="flex gap-2 items-center">
            <div className="bg-white shadow border rounded p-1 w-8 h-8 flex justify-center items-center">
              <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-4" />
            </div>
            <IconX className="text-scale-800" strokeWidth={2} size={16} />
            <div className="bg-black shadow rounded p-1 w-8 h-8 flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
                viewBox="0 0 512 512"
                className="w-4"
              >
                <path fill-rule="evenodd" d="M256,48,496,464H16Z" />
              </svg>
            </div>
          </div>
          <span className="text-sm" title={title}>
            {title}
          </span>
        </div>
      </ScaffoldContainer>
    </div>
  )
}

const maxWidthClasses = 'mx-auto w-full max-w-[1600px]'
const paddingClasses = 'px-6 lg:px-14 xl:px-28 2xl:px-32'

const IntegrationScaffoldContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} {...props} className={cn(maxWidthClasses, paddingClasses, className)} />
})

IntegrationScaffoldContainer.displayName = 'IntegrationScaffoldContainer'

export { IntegrationScaffoldContainer }
