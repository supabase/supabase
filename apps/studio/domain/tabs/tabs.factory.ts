import { Array, Option, Schema } from 'effect'
import type { KeyValueStore } from 'effect/unstable/persistence/KeyValueStore'
import { Atom, AtomRegistry } from 'effect/unstable/reactivity'

type RuntimeWithStorage = Atom.AtomRuntime<KeyValueStore>

const TabId = Schema.String.pipe(Schema.brand('TabId'))
type TabId = typeof TabId.Type

const createTabSchema = <T>(schema: Schema.Codec<T>) =>
  Schema.Struct({
    id: TabId,
    data: schema,
  })
type Tab<T> = { readonly id: TabId; readonly data: T }

const findTab = <T>(tabs: ReadonlyArray<Tab<T>>, id: TabId) =>
  Array.findFirst(tabs, (tab) => tab.id === id)

const insertAt = <A>(items: ReadonlyArray<A>, index: number, item: A) => {
  const clampedIndex = Math.min(Math.max(index, 0), items.length)
  return Array.insertAt(items, clampedIndex, item).pipe(
    Option.getOrElse(() => Array.append(items, item))
  )
}

const makePersistedTabsAtom = <T>(
  runtime: RuntimeWithStorage,
  key: string,
  schema: Schema.Codec<T>
) =>
  Atom.kvs({
    runtime,
    key,
    schema: Schema.Array(createTabSchema(schema)),
    defaultValue: () => [],
  })
type PersistedTabsAtom<T> = ReturnType<typeof makePersistedTabsAtom<T>>

const makePreviewTabAtom = <T>() => Atom.make<Option.Option<Tab<T>>>(Option.none())
type PreviewTabAtom<T> = ReturnType<typeof makePreviewTabAtom<T>>

const makeOrderAtom = <T>(
  persistedTabsAtom: PersistedTabsAtom<T>,
  previewTabAtom: PreviewTabAtom<T>
) => {
  const overrideAtom = Atom.make<Option.Option<ReadonlyArray<TabId>>>(Option.none())

  return Atom.writable(
    (get) => {
      const currentIds = Array.appendAll(
        Array.map(get(persistedTabsAtom), (tab) => tab.id),
        get(previewTabAtom).pipe(
          Option.map((tab) => tab.id),
          Option.toArray
        )
      )
      const known = get(overrideAtom).pipe(Option.getOrElse((): ReadonlyArray<TabId> => []))
      const kept = Array.filter(known, (id) =>
        Array.some(currentIds, (currentId) => currentId === id)
      )
      const added = Array.filter(currentIds, (id) => !Array.some(kept, (keptId) => keptId === id))
      return Array.appendAll(kept, added)
    },
    (ctx, value: ReadonlyArray<TabId>) => {
      ctx.set(overrideAtom, Option.some(value))
    }
  )
}
type OrderAtom = ReturnType<typeof makeOrderAtom>

const makeTabsAtom = <T>(
  orderAtom: OrderAtom,
  persistedTabsAtom: PersistedTabsAtom<T>,
  previewTabAtom: PreviewTabAtom<T>
) =>
  Atom.readable((get) => {
    const all = get(previewTabAtom).pipe(
      Option.match({
        onNone: () => get(persistedTabsAtom),
        onSome: (tab) => Array.append(get(persistedTabsAtom), tab),
      })
    )
    return Array.flatMap(get(orderAtom), (id) => Option.toArray(findTab(all, id)))
  })
type TabsAtom<T> = ReturnType<typeof makeTabsAtom<T>>

const makeCurrentTabAtom = <T>(tabsAtom: TabsAtom<T>) => {
  const selectedTabIdAtom = Atom.make<Option.Option<TabId>>(Option.none())

  return Atom.writable(
    (get) => {
      const tabs = get(tabsAtom)
      const selectedTab = get(selectedTabIdAtom).pipe(Option.flatMap((id) => findTab(tabs, id)))
      return selectedTab.pipe(
        Option.orElse(() => Array.head(tabs)),
        Option.map((tab) => tab.id)
      )
    },
    (ctx, value: TabId) => {
      const tabs = ctx.get(tabsAtom)
      if (Array.some(tabs, (tab) => tab.id === value)) {
        ctx.set(selectedTabIdAtom, Option.some(value))
      }
    }
  )
}

export const tabsFactory = <T>(
  runtime: RuntimeWithStorage,
  key: string,
  schema: Schema.Codec<T>
) => {
  const persistedTabsAtom = makePersistedTabsAtom(runtime, key, schema)
  const previewTabAtom = makePreviewTabAtom<T>()
  const orderAtom = makeOrderAtom(persistedTabsAtom, previewTabAtom)
  const tabsAtom = makeTabsAtom(orderAtom, persistedTabsAtom, previewTabAtom)
  const currentTabAtom = makeCurrentTabAtom(tabsAtom)

  const addTab = (registry: AtomRegistry.AtomRegistry, data: T, index?: number) => {
    const id = TabId.make(crypto.randomUUID())
    // Read the order before the preview tab exists: orderAtom reconciles itself
    // against previewTabAtom/persistedTabsAtom on every read, so writing the
    // preview first would make it self-heal the id in before this inserts it.
    const order = registry.get(orderAtom)
    registry.set(previewTabAtom, Option.some({ id, data }))
    registry.set(orderAtom, insertAt(order, index ?? order.length, id))
    registry.set(currentTabAtom, id)
    return id
  }

  const persistTab = (registry: AtomRegistry.AtomRegistry, id: TabId) => {
    const preview = registry.get(previewTabAtom)
    if (Option.isNone(preview) || preview.value.id !== id) return

    const persistedTabs = Array.append(registry.get(persistedTabsAtom), preview.value)
    const order = registry.get(orderAtom)
    registry.set(
      persistedTabsAtom,
      Array.flatMap(order, (tabId) => Option.toArray(findTab(persistedTabs, tabId)))
    )
    registry.set(previewTabAtom, Option.none())
  }

  const closeTab = (registry: AtomRegistry.AtomRegistry, id: TabId) => {
    const preview = registry.get(previewTabAtom)
    if (Option.isSome(preview) && preview.value.id === id) {
      registry.set(previewTabAtom, Option.none())
    } else {
      registry.set(
        persistedTabsAtom,
        Array.filter(registry.get(persistedTabsAtom), (tab) => tab.id !== id)
      )
    }
    registry.set(
      orderAtom,
      Array.filter(registry.get(orderAtom), (tabId) => tabId !== id)
    )
  }

  const reorderTab = (registry: AtomRegistry.AtomRegistry, id: TabId, index: number) => {
    const withoutId = Array.filter(registry.get(orderAtom), (tabId) => tabId !== id)
    const nextOrder = insertAt(withoutId, index, id)
    registry.set(orderAtom, nextOrder)

    const persistedTabs = registry.get(persistedTabsAtom)
    if (Array.some(persistedTabs, (tab) => tab.id === id)) {
      registry.set(
        persistedTabsAtom,
        Array.flatMap(nextOrder, (tabId) => Option.toArray(findTab(persistedTabs, tabId)))
      )
    }
  }

  return {
    tabsAtom,
    currentTabAtom,
    addTab,
    persistTab,
    closeTab,
    reorderTab,
  }
}
