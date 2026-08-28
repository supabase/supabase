import { Effect, Layer, Option, Schema } from 'effect'
import * as KeyValueStore from 'effect/unstable/persistence/KeyValueStore'
import { Atom, AtomRegistry } from 'effect/unstable/reactivity'
import { afterEach, describe, expect, it } from 'vitest'

import { tabsFactory } from './tabs.factory'
import { waitFor } from '@/tests/lib/atom-test-utils'

const DataSchema = Schema.Struct({ label: Schema.String })

const makeMemoryStore = () => {
  const store = new Map<string, string>()
  return KeyValueStore.makeStringOnly({
    get: (key) => Effect.sync(() => store.get(key)),
    set: (key, value) =>
      Effect.sync(() => {
        store.set(key, value)
      }),
    remove: (key) =>
      Effect.sync(() => {
        store.delete(key)
      }),
    clear: Effect.sync(() => {
      store.clear()
    }),
    size: Effect.sync(() => store.size),
  })
}

const registries: Array<AtomRegistry.AtomRegistry> = []

afterEach(() => {
  registries.splice(0).forEach((registry) => registry.dispose())
})

const setup = (
  layer: Layer.Layer<KeyValueStore.KeyValueStore> = Layer.succeed(
    KeyValueStore.KeyValueStore,
    makeMemoryStore()
  )
) => {
  const runtime = Atom.runtime(layer)
  const registry = AtomRegistry.make()
  registries.push(registry)
  const factory = tabsFactory(runtime, 'test-tabs', DataSchema)
  return { registry, factory, layer }
}

const labelsOf = (tabs: ReadonlyArray<{ data: { label: string } }>) =>
  tabs.map((tab) => tab.data.label)

describe('tabsFactory', () => {
  describe('tabsAtom', () => {
    it('starts empty', () => {
      const { registry, factory } = setup()
      expect(registry.get(factory.tabsAtom)).toEqual([])
    })

    it('includes a tab added via addTab', () => {
      const { registry, factory } = setup()
      factory.addTab(registry, { label: 'A' })
      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['A'])
    })

    it('reflects persisted and preview tabs together, in order', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.persistTab(registry, idB)
      factory.addTab(registry, { label: 'C' }) // stays preview

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['A', 'B', 'C'])
    })

    it('inserts a new tab at an explicit index', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.persistTab(registry, idB)
      factory.addTab(registry, { label: 'C' }, 1)

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['A', 'C', 'B'])
    })
  })

  describe('addTab', () => {
    it('returns a distinct id for each call', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      const idB = factory.addTab(registry, { label: 'B' })
      expect(idA).not.toEqual(idB)
    })

    it('focuses the newly added tab', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      expect(registry.get(factory.currentTabAtom)).toEqual(Option.some(idA))

      const idB = factory.addTab(registry, { label: 'B' })
      expect(registry.get(factory.currentTabAtom)).toEqual(Option.some(idB))
    })

    it('replaces the existing preview tab rather than keeping both', () => {
      const { registry, factory } = setup()
      factory.addTab(registry, { label: 'A' })
      factory.addTab(registry, { label: 'B' })

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['B'])
    })

    it('does not replace a tab that has already been persisted', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      factory.addTab(registry, { label: 'B' })

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['A', 'B'])
    })
  })

  describe('persistTab', () => {
    it('moves the matching preview tab into the persisted set and clears the preview slot', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      // Adding a second preview tab does not replace A anymore, proving A is persisted.
      factory.addTab(registry, { label: 'B' })

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['A', 'B'])
    })

    it('is a no-op for an id that is not the current preview tab', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)

      const before = registry.get(factory.tabsAtom)
      factory.persistTab(registry, idA) // already persisted, no longer the preview tab
      expect(registry.get(factory.tabsAtom)).toEqual(before)

      const unknownId = 'not-a-real-id' as Parameters<typeof factory.persistTab>[1]
      factory.persistTab(registry, unknownId)
      expect(registry.get(factory.tabsAtom)).toEqual(before)
    })

    it('persists the tab at its current visual position', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' }) // preview
      factory.reorderTab(registry, idB, 0)
      factory.persistTab(registry, idB)

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['B', 'A'])
    })
  })

  describe('closeTab', () => {
    it('clears the preview tab without touching persisted tabs', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.closeTab(registry, idB)

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['A'])
    })

    it('removes a persisted tab', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.persistTab(registry, idB)
      factory.closeTab(registry, idA)

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['B'])
    })

    it('falls back currentTabAtom when the selected tab is closed', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.persistTab(registry, idB)
      registry.set(factory.currentTabAtom, idB)

      factory.closeTab(registry, idB)

      expect(registry.get(factory.currentTabAtom)).toEqual(Option.some(idA))
    })

    it('results in Option.none() when the last tab is closed', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.closeTab(registry, idA)

      expect(registry.get(factory.tabsAtom)).toEqual([])
      expect(registry.get(factory.currentTabAtom)).toEqual(Option.none())
    })
  })

  describe('reorderTab', () => {
    it('moves a persisted tab to a new index', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.persistTab(registry, idB)
      const idC = factory.addTab(registry, { label: 'C' })
      factory.persistTab(registry, idC)

      factory.reorderTab(registry, idC, 0)

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['C', 'A', 'B'])
    })

    it('moves the preview tab anywhere within the order', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.persistTab(registry, idB)
      const idC = factory.addTab(registry, { label: 'C' }) // preview

      factory.reorderTab(registry, idC, 1)

      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['A', 'C', 'B'])
    })

    it('clamps out-of-range indices', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.persistTab(registry, idB)

      factory.reorderTab(registry, idB, -5)
      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['B', 'A'])

      factory.reorderTab(registry, idB, 999)
      expect(labelsOf(registry.get(factory.tabsAtom))).toEqual(['A', 'B'])
    })
  })

  describe('currentTabAtom', () => {
    it('defaults to Option.none() when there are no tabs', () => {
      const { registry, factory } = setup()
      expect(registry.get(factory.currentTabAtom)).toEqual(Option.none())
    })

    it('defaults to the first tab when nothing has been explicitly selected', async () => {
      // addTab always focuses the tab it creates, so the only way to observe a
      // session with tabs but no selection is a fresh registry that inherits
      // already-persisted tabs without ever calling addTab itself.
      const layer = Layer.succeed(KeyValueStore.KeyValueStore, makeMemoryStore())
      const first = setup(layer)
      const idA = first.factory.addTab(first.registry, { label: 'A' })
      first.factory.persistTab(first.registry, idA)
      const idB = first.factory.addTab(first.registry, { label: 'B' })
      first.factory.persistTab(first.registry, idB)
      await waitFor(first.registry, first.factory.tabsAtom, (tabs) => tabs.length === 2)

      const second = setup(layer)
      const reloaded = await waitFor(
        second.registry,
        second.factory.tabsAtom,
        (tabs) => tabs.length > 0
      )

      expect(second.registry.get(second.factory.currentTabAtom)).toEqual(
        Option.some(reloaded[0]?.id)
      )
    })

    it('can be set to any tab currently in tabsAtom, including the preview tab', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' }) // preview

      registry.set(factory.currentTabAtom, idA)
      expect(registry.get(factory.currentTabAtom)).toEqual(Option.some(idA))

      registry.set(factory.currentTabAtom, idB)
      expect(registry.get(factory.currentTabAtom)).toEqual(Option.some(idB))
    })

    it('ignores writes for ids not currently in tabsAtom', () => {
      const { registry, factory } = setup()
      const idA = factory.addTab(registry, { label: 'A' })
      factory.persistTab(registry, idA)
      const idB = factory.addTab(registry, { label: 'B' })
      factory.closeTab(registry, idB) // idB no longer exists

      registry.set(factory.currentTabAtom, idA)
      registry.set(factory.currentTabAtom, idB)

      expect(registry.get(factory.currentTabAtom)).toEqual(Option.some(idA))
    })
  })

  describe('persistence across reload', () => {
    it('preserves persisted tabs and their order in a new registry against the same storage', async () => {
      const layer = Layer.succeed(KeyValueStore.KeyValueStore, makeMemoryStore())
      const first = setup(layer)
      const idA = first.factory.addTab(first.registry, { label: 'A' })
      first.factory.persistTab(first.registry, idA)
      const idB = first.factory.addTab(first.registry, { label: 'B' })
      first.factory.persistTab(first.registry, idB)
      first.factory.addTab(first.registry, { label: 'C' }) // preview, should not survive reload

      // Let the writes flush through the (effectful) KeyValueStore before "reloading".
      await waitFor(first.registry, first.factory.tabsAtom, (tabs) => tabs.length === 3)

      const second = setup(layer)
      const reloaded = await waitFor(
        second.registry,
        second.factory.tabsAtom,
        (tabs) => tabs.length > 0
      )

      expect(labelsOf(reloaded)).toEqual(['A', 'B'])
    })

    it('does not leak tabs between different storage keys', async () => {
      const layer = Layer.succeed(KeyValueStore.KeyValueStore, makeMemoryStore())
      const runtime = Atom.runtime(layer)
      const registryA = AtomRegistry.make()
      const registryB = AtomRegistry.make()
      registries.push(registryA, registryB)

      const factoryA = tabsFactory(runtime, 'key-a', DataSchema)
      const factoryB = tabsFactory(runtime, 'key-b', DataSchema)

      const idA = factoryA.addTab(registryA, { label: 'A' })
      factoryA.persistTab(registryA, idA)
      await waitFor(registryA, factoryA.tabsAtom, (tabs) => tabs.length === 1)

      expect(registryB.get(factoryB.tabsAtom)).toEqual([])
    })
  })
})
