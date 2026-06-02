import { useFlag, useParams } from 'common'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { generateObservabilityMenuItems } from './ObservabilityMenu.utils'
import { useSupamonitorStatus } from '@/components/interfaces/QueryPerformance/hooks/useSupamonitorStatus'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'

const ObservabilityMenu = () => {
  const router = useRouter()
  const { ref } = useParams()
  const pageKey = (router.query.id || router.pathname.split('/')[4] || 'observability') as string
  const showOverview = useFlag('observabilityOverview')
  const { isSupamonitorEnabled } = useSupamonitorStatus()

  const storageSupported = useIsFeatureEnabled('project_storage:all')

  const preservedQueryParams = useMemo(() => {
    const { its, ite, isHelper, helperText } = router.query
    const params = new URLSearchParams()

    if (its && typeof its === 'string') params.set('its', its)
    if (ite && typeof ite === 'string') params.set('ite', ite)
    if (isHelper && typeof isHelper === 'string') params.set('isHelper', isHelper)
    if (helperText && typeof helperText === 'string') params.set('helperText', helperText)

    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }, [router.query])

  const menuItems = generateObservabilityMenuItems({
    ref,
    preservedQueryParams,
    showOverview,
    isSupamonitorEnabled,
    storageSupported,
    isPlatform: IS_PLATFORM,
  })

  return (
    <div>
      <ProductMenuShortcuts menu={menuItems} />
      <div className="flex flex-col gap-y-6">
        <ProductMenu
          page={pageKey}
          menu={menuItems.map((item) => ({
            ...item,
            items: item.items.map((subItem) => ({ ...subItem, items: [] })),
          }))}
        />
      </div>
    </div>
  )
}

export default ObservabilityMenu
