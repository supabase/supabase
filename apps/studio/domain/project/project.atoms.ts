import { Option } from 'effect'
import { Atom } from 'effect/unstable/reactivity'

export const projectRefAtom = Atom.make<Option.Option<string>>(Option.none())
