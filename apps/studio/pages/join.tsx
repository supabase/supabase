import Link from 'next/link'
import { useRouter } from 'next/router'

import { OrganizationInvite } from 'components/interfaces/OrganizationInvite/OrganizationInvite'
import { NextPageWithLayout } from 'types'
import { cn } from 'ui'

const JoinOrganizationPage: NextPageWithLayout = () => {
  const router = useRouter()

  return (
    <div
      className={cn(
        'flex h-full min-h-screen bg-studio',
        'w-full flex-col place-items-center',
        'items-center justify-center gap-8 px-5'
      )}
    >
      <Link href="/projects" className="flex items-center justify-center gap-4">
        <img
          src={`${router.basePath}/img/supabase-logo.svg`}
          alt="Supabase"
          className="block h-[24px] cursor-pointer rounded"
        />
      </Link>
      <div
        className={cn(
          'mx-auto overflow-hidden rounded-md border',
          'border-muted bg-alternative text-center shadow',
          'md:w-[400px]'
        )}
      >
        <OrganizationInvite />
      </div>
    </div>
  )
}

export default JoinOrganizationPage
