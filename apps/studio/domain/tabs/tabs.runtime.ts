import * as KeyValueStore from 'effect/unstable/persistence/KeyValueStore'
import { Atom } from 'effect/unstable/reactivity'

const keyValueStoreLayer =
  typeof window === 'undefined'
    ? KeyValueStore.layerMemory
    : KeyValueStore.layerStorage(() => window.localStorage)

export const tabsRuntime = Atom.runtime(keyValueStoreLayer)
