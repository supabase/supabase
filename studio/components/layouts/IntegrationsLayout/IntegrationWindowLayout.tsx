import { useParams } from 'common'
import { useFlag, withAuth } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { PropsWithChildren, ReactNode, forwardRef } from 'react'
import { IconX, cn } from 'ui'
import { ScaffoldContainer } from '../Scaffold'

export type IntegrationWindowLayoutProps = {
  title: string
  integrationIcon: ReactNode
}

const IntegrationWindowLayout = ({
  title,
  integrationIcon,
  children,
}: PropsWithChildren<IntegrationWindowLayoutProps>) => {
  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  return (
    <div className="flex w-full flex-col" style={{ height: maxHeight, maxHeight }}>
      <Header title={title} integrationIcon={integrationIcon} />

      {children}
    </div>
  )
}

const INTEGRATION_LAYOUT_MAX_WIDTH = '' // 'max-w-[720px]'

export default withAuth(IntegrationWindowLayout)

export const IntegrationWindowLayoutWithoutAuth = IntegrationWindowLayout

export type HeaderProps = {
  title: string
  integrationIcon: ReactNode
}

const Header = ({ title, integrationIcon }: HeaderProps) => {
  return (
    <div className="bg">
      <ScaffoldContainer className={cn('py-3 border-b', INTEGRATION_LAYOUT_MAX_WIDTH)}>
        <div className="flex items-center gap-6 w-full">
          <div className="flex gap-2 items-center">
            <div className="bg-white shadow border rounded p-1 w-8 h-8 flex justify-center items-center">
              <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-4" />
            </div>
            <IconX className="text-scale-800" strokeWidth={2} size={16} />
            {integrationIcon}
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

const IntegrationScaffoldContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} {...props} className={cn(maxWidthClasses, paddingClasses, className)} />
})

IntegrationScaffoldContainer.displayName = 'IntegrationScaffoldContainer'

export { IntegrationScaffoldContainer }
