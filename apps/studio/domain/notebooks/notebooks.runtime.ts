import { Atom } from 'effect/unstable/reactivity'

import { NotebooksApiLive } from './notebooks.api'

export const notebooksRuntime = Atom.runtime(NotebooksApiLive)
