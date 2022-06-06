import { FC } from 'react'
import Link from 'next/link'
import { useFlag } from 'hooks'
import { IconExternalLink } from '@supabase/ui'

const AppBannerWrapper: FC = ({ children }) => {
  const ongoingIncident = useFlag('ongoingIncident')

  return (
    <div className="flex h-full flex-col">
      {ongoingIncident && (
        <Link href="https://status.supabase.com">
          <a target="_blank">
            <div className="hover:bg-green-1000 flex cursor-pointer items-center justify-center space-x-2 bg-green-900 py-3 transition text-scale-400 dark:text-scale-1200">
              <p className="text-sm font-medium">
                We are currently investigating a technical issue, follow status.supabase.com for
                updates
              </p>
              <IconExternalLink size={16} strokeWidth={2} />
            </div>
          </a>
        </Link>
      )}
      {children}
    </div>
  )
}

export default AppBannerWrapper
