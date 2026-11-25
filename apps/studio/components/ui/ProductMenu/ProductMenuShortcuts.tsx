import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import type { ProductMenuGroup, ProductMenuGroupItem } from './ProductMenu.types'
import { navigateToUrl } from '@/lib/navigation'
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
  const navigate = useNavigate()
  const { shortcutId, url } = item

  const handleNavigate = useCallback(() => {
    void navigateToUrl(navigate, url)
  }, [navigate, url])

  useShortcut(shortcutId, handleNavigate, {
    label: shortcutId.startsWith('nav.advisors-') ? `Go to ${item.name}` : undefined,
  })

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
