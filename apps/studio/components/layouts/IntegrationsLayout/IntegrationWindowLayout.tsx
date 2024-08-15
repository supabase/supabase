import Link from 'next/link'
import { PropsWithChildren, ReactNode, forwardRef } from 'react'
import { IconBook, IconLifeBuoy, IconX, LoadingLine, cn } from 'ui'

import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import { ScaffoldContainer } from '../Scaffold'

export type IntegrationWindowLayoutProps = {
  title: string
  integrationIcon: ReactNode
  loading?: boolean
  docsHref?: string
}

const IntegrationWindowLayout = ({
  title,
  integrationIcon,
  children,
  loading = false,
  docsHref,
}: PropsWithChildren<IntegrationWindowLayoutProps>) => {
  return (
    <div className="flex w-full flex-col">
      <Header title={title} integrationIcon={integrationIcon} />
      <LoadingLine loading={loading} />
      <main className="overflow-auto flex flex-col h-full bg">{children}</main>
      <ScaffoldContainer className="bg-studio flex flex-row gap-6 py-6 border-t">
        {docsHref && (
          <Link
            href={docsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-foreground-light hover:text"
          >
            <IconBook size={16} />
            Docs
          </Link>
        )}
        <Link
          href={'https://supabase.com/support'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-light hover:text"
        >
          <IconLifeBuoy size={16} />
          Support
        </Link>
      </ScaffoldContainer>
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
      <ScaffoldContainer className={cn('py-3', INTEGRATION_LAYOUT_MAX_WIDTH)}>
        <div className="flex items-center gap-6 w-full">
          <div className="flex gap-2 items-center">
            <div className="bg-white shadow border rounded p-1 w-8 h-8 flex justify-center items-center">
              <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-4" />
            </div>
            <IconX className="text-border-stronger" strokeWidth={2} size={16} />
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
