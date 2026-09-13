'use client'

import { useEffect, useMemo, useRef } from 'react'

import { CommandListItem } from './CommandListItem'
import { EmptyState, GroupHeader, GroupSeparator } from './DefaultCommandList.helpers'
import { MenuItem, MenuItemGroup, OPERATOR_GROUP_LABELS } from './types'
import { groupMenuItemsByOperator } from './utils'

export type DefaultCommandListProps = {
  items: MenuItem[]
  highlightedIndex: number
  onSelect: (item: MenuItem) => void
  includeIcon?: boolean
  grouped?: boolean
}

export function DefaultCommandList({
  items,
  highlightedIndex,
  onSelect,
  includeIcon = true,
  grouped = false,
}: DefaultCommandListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const groups: MenuItemGroup[] = useMemo(() => {
    if (grouped) {
      return groupMenuItemsByOperator(items)
    }
    // Non-grouped items are treated as a single uncategorized group
    return [
      {
        group: 'uncategorized',
        items: items.map((item, index) => ({ item, index })),
      },
    ]
  }, [grouped, items])

  const showGroupHeaders = groups.length > 1

  useEffect(() => {
    const itemEl = itemRefs.current.get(highlightedIndex)
    if (itemEl && listRef.current) {
      itemEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [highlightedIndex])

  const setItemRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el)
    } else {
      itemRefs.current.delete(index)
    }
  }

  if (items.length === 0) {
    return (
      <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
        <EmptyState />
      </div>
    )
  }

  return (
    <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
      {groups.map((groupData, groupIndex) => (
        <div key={groupData.group}>
          {groupIndex > 0 && showGroupHeaders && <GroupSeparator />}
          {showGroupHeaders && groupData.group && (
            <GroupHeader label={OPERATOR_GROUP_LABELS[groupData.group]} />
          )}
          {groupData.items.map(({ item, index }) => (
            <CommandListItem
              key={`${item.value}-${item.label}`}
              item={item}
              isHighlighted={index === highlightedIndex}
              includeIcon={includeIcon}
              onSelect={onSelect}
              setRef={setItemRef(index)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
