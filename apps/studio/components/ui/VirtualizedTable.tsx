import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react'
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'

import { mergeRefs } from 'common'
import {
  cn,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

type TableComponentProps = React.ComponentProps<typeof Table>

interface VirtualizedTableProps<TItem> extends TableComponentProps {
  scrollContainerProps?: HTMLAttributes<HTMLDivElement>
  scrollContainerRef: React.Ref<HTMLDivElement>
  data: TItem[]
  children: ReactNode
  overscan?: number
  estimateSize: (index: number) => number
  getItemKey?: (item: TItem, index: number) => string
}

type VirtualizedTableContextValue<TItem> = {
  virtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
  virtualItems: VirtualItem[]
  data: TItem[]
  paddingTop: number
  paddingBottom: number
  getRowKey: (item: TItem, index: number) => string | number
}

const VirtualizedTableContext = createContext<VirtualizedTableContextValue<unknown> | null>(null)

const useVirtualizedTableContext = <TItem,>() => {
  const context = useContext(VirtualizedTableContext)
  if (!context) {
    throw new Error('VirtualizedTable components must be used within a VirtualizedTable')
  }
  return context as VirtualizedTableContextValue<TItem>
}

export const VirtualizedTable = <TItem,>({
  scrollContainerProps,
  scrollContainerRef: externalScrollContainerRef,
  containerProps,
  data,
  children,
  overscan = 5,
  estimateSize,
  getItemKey,
  ...tableProps
}: VirtualizedTableProps<TItem>) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerMergedRef = mergeRefs(scrollContainerRef, externalScrollContainerRef)

  const rowKeyGetter = useCallback(
    (item: TItem, index: number) => {
      return getItemKey ? getItemKey(item, index) : index
    },
    [getItemKey]
  )

  const getItemKeyFromIndex = useCallback(
    (index: number) => {
      const item = data[index]
      return item ? rowKeyGetter(item, index) : index
    },
    [data, rowKeyGetter]
  )

  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: data.length,
    getScrollElement: () => scrollContainerRef.current,
    overscan,
    estimateSize,
    getItemKey: getItemKeyFromIndex,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
  const paddingBottom =
    virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0

  const contextValue = useMemo<VirtualizedTableContextValue<TItem>>(
    () => ({
      virtualizer,
      virtualItems,
      data,
      paddingTop,
      paddingBottom,
      getRowKey: rowKeyGetter,
    }),
    [virtualizer, virtualItems, data, paddingTop, paddingBottom, rowKeyGetter]
  )

  const mergedContainerProps = useMemo(
    () => ({
      ...containerProps,
      className: cn('overflow-visible', containerProps?.className),
    }),
    [containerProps]
  )

  const { className: scrollClassName, ...restScrollContainerProps } = scrollContainerProps ?? {}

  return (
    <div
      ref={scrollContainerMergedRef}
      className={cn('h-full overflow-auto', scrollClassName)}
      {...restScrollContainerProps}
    >
      <VirtualizedTableContext.Provider
        value={contextValue as VirtualizedTableContextValue<unknown>}
      >
        <Table containerProps={mergedContainerProps} {...tableProps}>
          {children}
        </Table>
      </VirtualizedTableContext.Provider>
    </div>
  )
}

interface VirtualizedTableBodyProps<TItem>
  extends Omit<React.ComponentProps<typeof TableBody>, 'children'> {
  emptyContent?: ReactNode
  leadingContent?: ReactNode
  trailingContent?: ReactNode
  children: (item: TItem, index: number) => ReactElement
  paddingColSpan?: number
  paddingCellClassName?: string
}

export const VirtualizedTableBody = <TItem,>({
  emptyContent,
  leadingContent,
  trailingContent,
  children,
  paddingColSpan = 1,
  paddingCellClassName,
  ...props
}: VirtualizedTableBodyProps<TItem>) => {
  const { virtualizer, virtualItems, data, paddingTop, paddingBottom, getRowKey } =
    useVirtualizedTableContext<TItem>()

  const measurementRef = virtualizer.measureElement as unknown as Ref<HTMLTableRowElement>

  return (
    <TableBody {...props}>
      {leadingContent}
      {data.length === 0 ? (
        emptyContent ?? null
      ) : (
        <>
          {paddingTop > 0 && (
            <TableRow aria-hidden="true" style={{ height: paddingTop }}>
              <VirtualizedTableCell
                colSpan={paddingColSpan}
                className={cn('p-0', paddingCellClassName)}
              />
            </TableRow>
          )}
          {virtualItems.map((virtualItem) => {
            const item = data[virtualItem.index]
            if (item === undefined) return null

            const renderedRow = children(item, virtualItem.index)
            if (
              !isValidElement<
                Record<string, unknown> & {
                  ref?: Ref<HTMLTableRowElement> | null
                  ['data-index']?: number
                }
              >(renderedRow)
            ) {
              return renderedRow
            }

            const key = renderedRow.key ?? getRowKey(item, virtualItem.index)

            const existingRef = (
              renderedRow as unknown as { ref?: Ref<HTMLTableRowElement> | null }
            ).ref
            const combinedRef =
              existingRef != null
                ? mergeRefs<HTMLTableRowElement>(measurementRef, existingRef)
                : measurementRef

            return cloneElement(renderedRow, {
              key,
              ref: combinedRef,
              'data-index': virtualItem.index,
            })
          })}
          {paddingBottom > 0 && (
            <TableRow aria-hidden="true" style={{ height: paddingBottom }}>
              <VirtualizedTableCell
                colSpan={paddingColSpan}
                className={cn('p-0', paddingCellClassName)}
              />
            </TableRow>
          )}
        </>
      )}
      {trailingContent}
    </TableBody>
  )
}

export const VirtualizedTableHeader = TableHeader

export const VirtualizedTableHead = forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<typeof TableHead>
>(({ className, ...props }, ref) => {
  return <TableHead ref={ref} className={cn('sticky top-0 z-10 bg-200', className)} {...props} />
})
VirtualizedTableHead.displayName = 'VirtualizedTableHead'

export const VirtualizedTableRow = TableRow
export const VirtualizedTableCell = TableCell
export const VirtualizedTableFooter = TableFooter
export const VirtualizedTableCaption = TableCaption
