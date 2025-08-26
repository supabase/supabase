import Image from 'next/image'
import { PropsWithChildren, ReactNode } from 'react'

import { UserDropdown } from 'components/interfaces/UserDropdown'
import { FeedbackDropdown } from 'components/layouts/ProjectLayout/LayoutHeader/FeedbackDropdown'
import { BASE_PATH } from 'lib/constants'
import { cn, Separator } from 'ui'

export const ProjectClaimLayout = ({
  children,
  title,
  className,
}: PropsWithChildren<{
  title: ReactNode
  className?: string
}>) => {
  return (
    <>
      <div className="flex flex-row justify-between mx-auto w-full h-[52px] items-center px-4">
        <div className="flex items-center gap-2">
          <span className="sr-only">Supabase</span>
          <Image
            src={`${BASE_PATH}/img/supabase-logo.svg`}
            alt="Supabase Logo"
            height={20}
            width={20}
          />
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-x-2">
          <FeedbackDropdown className="hidden xs:flex" />
          <UserDropdown />
        </div>
      </div>
      <Separator />
      <div
        className={cn(
          'overflow-y-auto max-h-[calc(100vh-70px)] flex justify-center flex-grow',
          className
        )}
      >
        <div className="w-full h-full max-w-md">{children}</div>
      </div>
    </>
  )
}
