import Image from 'next/image'
import { PropsWithChildren, ReactNode } from 'react'

import { UserDropdown } from 'components/interfaces/UserDropdown'
import { FeedbackDropdown } from 'components/layouts/ProjectLayout/LayoutHeader/FeedbackDropdown'
import { BASE_PATH } from 'lib/constants'
import { Separator } from 'ui'

export const ProjectClaimLayout = ({
  children,
  title,
}: PropsWithChildren<{
  title: ReactNode
}>) => {
  return (
    <>
      <div className="flex flex-row justify-between flex-grow mx-auto w-full h-[52px] items-center px-4">
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
      <div className="overflow-y-auto max-h-[calc(100vh-70px)] flex justify-center">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </>
  )
}
