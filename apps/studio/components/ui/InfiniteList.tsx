import { Virtualizer, useVirtualizer } from '@tanstack/react-virtual'
import {
  CSSProperties,
  ComponentPropsWithRef,
  ComponentType,
  ElementType,
  ReactNode,
  Ref,
  createContext,
  createElement,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type PropsWithChildren,
} from 'react'

import { Skeleton, cn } from 'ui'

// Regular memo erases generics, so this helper adds them back
// any here is intentional to allow for generic components and does not affect
// type safety of the wrapped component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typedMemo = <Component extends (props: any) => JSX.Element | null>(
  component: Component,
  propsAreEqual?: (
    prevProps: Readonly<Parameters<Component>[0]>,
    nextProps: Readonly<Parameters<Component>[0]>
  ) => boolean
) => memo(component, propsAreEqual) as unknown as Component & { displayName?: string }

const createStyleObject = ({ size, start }: { size: number; start: number }): CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: `${size}px`,
  transform: `translateY(${start}px)`,
})

type VirtualizerInstance = Virtualizer<Element, Element>
type VirtualItems = ReturnType<VirtualizerInstance['getVirtualItems']>

type VirtualizerContextValue = {
  virtualizer: VirtualizerInstance
  virtualItems: VirtualItems
}

const VirtualizerContext = createContext<VirtualizerContextValue | null>(null)

export const VirtualizerProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: VirtualizerContextValue }>) => {
  return <VirtualizerContext.Provider value={value}>{children}</VirtualizerContext.Provider>
}

export const useVirtualizerContext = () => {
  const context = useContext(VirtualizerContext)
  if (!context) {
    throw new Error('useVirtualizerContext must be used within a VirtualizerProvider')
  }
  return context
}

type ExtractRefType<Elem extends ElementType> =
  ComponentPropsWithRef<Elem> extends { ref?: Ref<infer RefType> } ? RefType : never

type ExtractScrollElementFromRefComponent<RefComponent extends ElementType> = Extract<
  ExtractRefType<RefComponent>,
  Element
>

type ScrollWrapperComponentConstraints<Component extends ElementType> =
  ComponentPropsWithRef<Component> extends { className?: string }
    ? ComponentPropsWithRef<Component> extends { children?: ReactNode | ReactNode[] }
      ? ExtractRefType<Component> extends never
        ? { ERROR_WRAPPER_COMPONENT_REQUIRES_REF_SUPPORT: never }
        : ExtractRefType<Component> extends Element
          ? {}
          : { ERROR_WRAPPER_COMPONENT_REF_MUST_EXTEND_ELEMENT: never }
      : { ERROR_WRAPPER_COMPONENT_REQUIRES_CHILDREN: never }
    : { ERROR_WRAPPER_COMPONENT_REQUIRES_CLASSNAME: never }

type InfiniteListWrapperProps<Item, Component extends ElementType = 'div'> = {
  className?: string
  items: Item[]
  getItemKey?: (index: number) => string
  getItemSize: (index: number) => number
  hasNextPage?: boolean
  isLoadingNextPage?: boolean
  onLoadNextPage?: () => void
  Component?: Component
} & ScrollWrapperComponentConstraints<Component>

export const InfiniteListScrollWrapper = <Item, Wrapper extends ElementType = 'div'>({
  children,
  items,
  getItemKey,
  getItemSize,
  hasNextPage = false,
  isLoadingNextPage = false,
  onLoadNextPage = () => {},
  className,
  Component,
}: PropsWithChildren<InfiniteListWrapperProps<Item, Wrapper>>) => {
  const scrollRef = useRef<ExtractScrollElementFromRefComponent<Wrapper> | null>(null)

  const rowVirtualizer = useVirtualizer<ExtractScrollElementFromRefComponent<Wrapper>, Element>({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => scrollRef.current,
    getItemKey,
    estimateSize: getItemSize,
    overscan: 5,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const virtualizerContextValue = useMemo(
    () => ({
      virtualizer: rowVirtualizer as unknown as Virtualizer<Element, Element>,
      virtualItems,
    }),
    [rowVirtualizer, virtualItems]
  )

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    if (lastItem.index >= items.length - 1 && hasNextPage && !isLoadingNextPage) {
      onLoadNextPage()
    }
  }, [virtualItems, items.length, hasNextPage, isLoadingNextPage, onLoadNextPage])

  const WrapperToRender: Wrapper = Component ?? ('div' as Wrapper)
  const wrapperProps = {
    ref: (node: ExtractScrollElementFromRefComponent<Wrapper> | null) => {
      scrollRef.current = node
    },
    className: cn('overflow-auto', className),
    children,
  } as ComponentPropsWithRef<Wrapper>

  return (
    <VirtualizerProvider value={virtualizerContextValue}>
      <WrapperToRender {...wrapperProps} />
    </VirtualizerProvider>
  )
}

type ComponentWithStylePropConstraint<Component extends ElementType> =
  ComponentProps<Component> extends { style?: CSSProperties }
    ? {}
    : { ERROR_SIZER_COMPONENT_MUST_TAKE_STYLE_PROP: never }

type InfiniteListSizerProps = {
  Component?: ElementType
} & ComponentWithStylePropConstraint<ElementType>

export const InfiniteListSizer = ({
  children,
  Component = 'div',
}: PropsWithChildren<InfiniteListSizerProps>) => {
  const { virtualizer } = useVirtualizerContext()

  return (
    <Component
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {children}
    </Component>
  )
}

export type RowComponentBaseProps<Item> = {
  index: number
  item: Item
  style?: CSSProperties
}

type InfiniteListItemProps<
  Item,
  ExtraProps extends object = Record<string, never>,
  RowComponent extends ComponentType<RowComponentBaseProps<Item> & ExtraProps> = ComponentType<
    RowComponentBaseProps<Item> & ExtraProps
  >,
> = {
  index: number
  start: number
  size: number
  item: Item
  itemProps?: ExtraProps
  ItemComponent: RowComponent
}

const MemoizedInfiniteListItem = typedMemo(
  <
    Item,
    ExtraProps extends object = Record<string, never>,
    RowComponent extends ComponentType<RowComponentBaseProps<Item> & ExtraProps> = ComponentType<
      RowComponentBaseProps<Item> & ExtraProps
    >,
  >({
    index,
    start,
    size,
    item,
    itemProps,
    ItemComponent,
  }: InfiniteListItemProps<Item, ExtraProps, RowComponent>) => {
    const styleObject = useMemo<CSSProperties>(
      () => createStyleObject({ size, start }),
      [size, start]
    )

    const baseProps = useMemo<RowComponentBaseProps<Item>>(
      () => ({
        index,
        item,
        style: styleObject,
      }),
      [index, item, styleObject]
    )

    const combinedProps = useMemo(
      () =>
        ({
          ...baseProps,
          ...(itemProps ?? ({} as ExtraProps)),
        }) as RowComponentBaseProps<Item> & ExtraProps,
      [baseProps, itemProps]
    )

    // Not JSX to avoid type error with generic function component
    return createElement(ItemComponent, combinedProps)
  }
)
MemoizedInfiniteListItem.displayName = 'MemoizedInfiniteListItem'

type InfiniteListItemsProps<
  Item,
  ExtraProps extends object = Record<string, never>,
  RowComponent extends ComponentType<RowComponentBaseProps<Item> & ExtraProps> = ComponentType<
    RowComponentBaseProps<Item> & ExtraProps
  >,
> = {
  items: Item[]
  itemProps?: ExtraProps
  ItemComponent: RowComponent
  LoaderComponent: ComponentType<{ style?: CSSProperties }>
}

export const InfiniteListItems = <
  Item,
  ExtraProps extends object = Record<string, never>,
  RowComponent extends ComponentType<RowComponentBaseProps<Item> & ExtraProps> = ComponentType<
    RowComponentBaseProps<Item> & ExtraProps
  >,
>({
  items,
  itemProps,
  ItemComponent,
  LoaderComponent,
}: InfiniteListItemsProps<Item, ExtraProps, RowComponent>) => {
  const { virtualItems } = useVirtualizerContext()

  return (
    <>
      {virtualItems.map((virtualRow) => {
        const isLoaderRow = virtualRow.index > items.length - 1
        const item = items[virtualRow.index]

        return isLoaderRow ? (
          <LoaderComponent
            key={virtualRow.index}
            style={createStyleObject({ size: virtualRow.size, start: virtualRow.start })}
          />
        ) : (
          // Not JSX so we can pass type arguments to the generic function component
          createElement(MemoizedInfiniteListItem<Item, ExtraProps>, {
            key: virtualRow.index,
            index: virtualRow.index,
            start: virtualRow.start,
            size: virtualRow.size,
            item,
            itemProps,
            ItemComponent,
          })
        )
      })}
    </>
  )
}

type InfiniteListDefaultProps<Item, ItemComponentProps extends object = Record<string, never>> = {
  className?: string
  items: Item[]
  itemProps?: ItemComponentProps
  getItemKey?: (index: number) => string
  getItemSize: (index: number) => number
  hasNextPage?: boolean
  isLoadingNextPage?: boolean
  onLoadNextPage?: () => void
  ItemComponent: ComponentType<RowComponentBaseProps<Item> & ItemComponentProps>
  LoaderComponent: ComponentType<{ style?: CSSProperties }>
}

export const InfiniteListDefault = <
  Item,
  ItemComponentProps extends object = Record<string, never>,
>({
  className,
  items,
  itemProps,
  getItemKey,
  getItemSize,
  hasNextPage = false,
  isLoadingNextPage = false,
  onLoadNextPage = () => {},
  ItemComponent,
  LoaderComponent,
}: InfiniteListDefaultProps<Item, ItemComponentProps>) => {
  return (
    <InfiniteListScrollWrapper
      className={className}
      items={items}
      getItemKey={getItemKey}
      getItemSize={getItemSize}
      hasNextPage={hasNextPage}
      isLoadingNextPage={isLoadingNextPage}
      onLoadNextPage={onLoadNextPage}
    >
      <InfiniteListSizer>
        <InfiniteListItems
          items={items}
          itemProps={itemProps}
          ItemComponent={ItemComponent}
          LoaderComponent={LoaderComponent}
        />
      </InfiniteListSizer>
    </InfiniteListScrollWrapper>
  )
}

export const LoaderForIconMenuItems = ({ style }: { style?: CSSProperties }) => (
  <div className="space-y-1 my-1" style={style}>
    <div className="flex flex-col gap-y-1">
      <div className="flex flex-row h-6 px-4 items-center gap-2">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-40 h-4" />
      </div>
      <div className="flex flex-row h-6 px-4 items-center gap-2">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="flex flex-row h-6 px-4 items-center gap-2 opacity-75">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-20 h-4" />
      </div>
      <div className="flex flex-row h-6 px-4 items-center gap-2 opacity-50">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-40 h-4" />
      </div>
      <div className="flex flex-row h-6 px-4 items-center gap-2 opacity-25">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-20 h-4" />
      </div>
    </div>
  </div>
)
