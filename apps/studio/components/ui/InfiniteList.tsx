import memoize from 'memoize-one'
import { CSSProperties, ComponentType, MutableRefObject, ReactNode, memo, useRef } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList, areEqual } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { propsAreEqual } from 'lib/helpers'

/**
 * Note that the loading more logic of this component works best with a cursor-based
 * pagination API such that each payload response from the API returns a structure like
 * { cursor, items, hasNext, hasPrevious }
 */

const createItemData = memoize((items, itemProps) => ({ items, ...itemProps }))

export type ItemRenderer<T, P> = ComponentType<
  {
    item: T
    listRef: MutableRefObject<VariableSizeList<any> | null | undefined>
    index: number
  } & P
>

export interface ItemProps<T, P> {
  data: {
    items: T[]
    itemProps: P
    ItemComponent: ItemRenderer<T, P>
    listRef: MutableRefObject<VariableSizeList<any> | null | undefined>
    LoaderComponent?: ReactNode
  }
  index: number
  style: CSSProperties
}

export interface InfiniteListProps<T, P> {
  items?: T[]
  itemProps?: P
  hasNextPage?: boolean
  isLoadingNextPage?: boolean
  getItemSize?: (index: number) => number
  onLoadNextPage?: () => void
  ItemComponent?: ItemRenderer<T, P>
  LoaderComponent?: ReactNode
}

const Item = memo(<T, P>({ data, index, style }: ItemProps<T, P>) => {
  const { items, itemProps, ItemComponent, listRef, LoaderComponent } = data
  const item = index < items.length ? items[index] : undefined

  return item ? (
    <div style={style}>
      <ItemComponent index={index} item={item} listRef={listRef} {...itemProps} />
    </div>
  ) : LoaderComponent !== undefined ? (
    <div style={style}>{LoaderComponent}</div>
  ) : (
    <div className="space-y-1 my-1" style={style}>
      <ShimmeringLoader />
      <ShimmeringLoader />
      <ShimmeringLoader />
    </div>
  )
}, areEqual)

Item.displayName = 'Item'

function InfiniteList<T, P>({
  items = [],
  itemProps,
  hasNextPage = false,
  isLoadingNextPage = false,
  getItemSize = () => 40,
  onLoadNextPage = () => {},
  ItemComponent = () => null,
  LoaderComponent,
}: InfiniteListProps<T, P>) {
  const listRef = useRef<VariableSizeList<any> | null>()

  // Only load 1 page of items at a time
  // Pass an empty callback to InfiniteLoader in case it asks to load more than once
  const loadMoreItems = isLoadingNextPage ? () => {} : onLoadNextPage

  // Every row is loaded except for our loading indicator row
  const isItemLoaded = (index: number) => {
    return !hasNextPage || index < items.length
  }

  const itemCount = hasNextPage ? items.length + 1 : items.length
  const itemData = createItemData(items, { itemProps, ItemComponent, LoaderComponent, listRef })

  return (
    <div className="relative flex flex-col flex-grow">
      <div className="flex-grow">
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <InfiniteLoader
              itemCount={itemCount}
              isItemLoaded={isItemLoaded}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <VariableSizeList
                  ref={(refy) => {
                    ref(refy)
                    listRef.current = refy
                  }}
                  height={height ?? 0}
                  width={width ?? 0}
                  itemCount={itemCount}
                  itemData={itemData}
                  itemSize={getItemSize}
                  onItemsRendered={onItemsRendered}
                >
                  {Item}
                </VariableSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          pointerEvents: 'none', //https://github.com/bvaughn/react-window/issues/455
        }}
      />
    </div>
  )
}

// memo erases generics so this magic is needed
export default memo(InfiniteList, propsAreEqual) as typeof InfiniteList
