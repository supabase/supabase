import { useRouter } from 'next/router'
import { useCallback } from 'react'

import type { ProductMenuGroup, ProductMenuGroupItem } from './ProductMenu.types'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface ProductMenuShortcutsProps {
  menu: ProductMenuGroup[]
}

type ProductMenuShortcutItem = ProductMenuGroupItem & {
  shortcutId: NonNullable<ProductMenuGroupItem['shortcutId']>
}

const getShortcutItems = (items: ProductMenuGroupItem[]): ProductMenuShortcutItem[] => {
  return items.flatMap((item) => {
    const childItems = item.childItems ? getShortcutItems(item.childItems) : []

    if (!item.shortcutId || !item.url || item.disabled || item.isExternal) {
      return childItems
    }

    return [item as ProductMenuShortcutItem, ...childItems]
  })
}

const ProductMenuShortcut = ({ item }: { item: ProductMenuShortcutItem }) => {
  const router = useRouter()
  const { shortcutId, url } = item

  const navigate = useCallback(() => {
    router.push(url)
  }, [router, url])

  useShortcut(shortcutId, navigate)

  return null
}

export const ProductMenuShortcuts = ({ menu }: ProductMenuShortcutsProps) => {
  const shortcutItems = menu.flatMap((group) => getShortcutItems(group.items))

  return (
    <>
      {shortcutItems.map((item) => (
        <ProductMenuShortcut key={`${item.shortcutId}-${item.url}`} item={item} />
      ))}
    </>
  )
}
