import type { Atom, AtomRegistry } from 'effect/unstable/reactivity'

/** Resolves once `atom`'s value in `registry` satisfies `predicate`. */
export const waitFor = <A>(
  registry: AtomRegistry.AtomRegistry,
  atom: Atom.Atom<A>,
  predicate: (value: A) => boolean
): Promise<A> =>
  new Promise((resolve) => {
    const current = registry.get(atom)
    if (predicate(current)) {
      resolve(current)
      return
    }
    const unsubscribe = registry.subscribe(atom, (value) => {
      if (predicate(value)) {
        unsubscribe()
        resolve(value)
      }
    })
  })
