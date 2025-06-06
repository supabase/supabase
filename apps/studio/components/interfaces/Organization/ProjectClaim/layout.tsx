import Image from 'next/image'
import { PropsWithChildren } from 'react'

import { BASE_PATH } from 'lib/constants'
import { Separator } from 'ui'

export const ProjectClaimLayout = ({
  children,
  title,
  description,
}: PropsWithChildren<{
  title: React.ReactNode
  description?: string
}>) => {
  return (
    <>
      <div className="flex flex-row justify-between flex-grow mx-auto w-full max-w-xl space-y-4 h-[52px]">
        <div className="flex items-center gap-2">
          <span className="sr-only">Supabase</span>
          <Image
            src={`${BASE_PATH}/img/supabase-logo.svg`}
            alt="Supabase Logo"
            height={20}
            width={20}
          />
          <span>{title}</span>
        </div>
        {description && <span className="text-foreground-light text-xs">{description}</span>}
      </div>
      <Separator />
      <div className="overflow-y-auto max-h-[calc(100vh-70px)] flex justify-center">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </>
  )
}
