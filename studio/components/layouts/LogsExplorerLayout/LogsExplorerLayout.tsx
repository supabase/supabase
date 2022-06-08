import React, { useEffect } from 'react'
import BaseLayout from 'components/layouts'
import { observer } from 'mobx-react-lite'
import { useStore, withAuth } from 'hooks'
import { Badge, IconList, Loading } from '@supabase/ui'
import LogsNavigation from 'components/interfaces/Settings/Logs/LogsNavigation'

const PageLayout = ({
  subtitle,
  children,
}: {
  subtitle?: React.ReactNode
  children?: React.ReactNode
}) => {
  const { content, ui } = useStore()

  useEffect(() => {
    content.load()
  }, [ui.selectedProject])

  if (!content.isLoaded) {
    return (
      <BaseLayout>
        <Loading active={true}>{null}</Loading>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="h-full flex flex-col flex-grow py-6">
        <div
          className={[
            'w-full mx-auto flex flex-col transition-all gap-4 px-5',
            'lg:px-16 xl:px-24 1xl:px-28 2xl:px-32',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 bg-brand-300 border border-brand-600 rounded text-brand-900
            flex items-center justify-center
          "
            >
              <IconList size={14} strokeWidth={3} />
            </div>
            <h1 className="text-2xl text-scale-1200">Logs Explorer</h1>
            {subtitle && <Badge color="scale">{subtitle}</Badge>}
          </div>
          <LogsNavigation />
        </div>
        <div
          className={[
            'h-full w-full flex flex-col flex-grow mx-auto gap-4 transition-all',
            'px-5 lg:px-16 1xl:px-28 2xl:px-32',
          ].join(' ')}
        >
          {children}
        </div>
      </div>
    </BaseLayout>
  )
}

export default withAuth(observer(PageLayout))
