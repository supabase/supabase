import { useEffect, useRef } from 'react'

export function useStateTransition<
  State extends { type: string },
  PrevType extends State['type'],
  NewType extends State['type'],
>(
  state: State,
  // Kept in the signature for documentation / type-narrowing of `cb`'s first
  // arg, but the entry-detection logic below no longer uses it. See the
  // comment in the effect for why.
  _prevTest: PrevType,
  newTest: NewType,
  cb: (
    prevState: Extract<State, { type: PrevType }>,
    currState: Extract<State, { type: NewType }>
  ) => void
): void {
  const prevState = useRef(state)

  useEffect(() => {
    const savedPrevState = prevState.current

    // Fire when entering newTest from any other state. React 18+ auto-batches
    // dispatches across awaits (e.g. dispatch SUBMIT → await → mutation
    // onError dispatch ERROR), which collapses `prevTest → newTest` into a
    // single render where the intermediate `prevTest` state is never observed.
    // Treat prevTest as advisory only: as long as the previous state was *not*
    // already `newTest`, fire the callback.
    if (savedPrevState.type !== newTest && state.type === newTest) {
      // Pass the previous state through even if it doesn't match prevTest —
      // callers shouldn't rely on it being prevTest in batched flows. Cast is
      // safe at the type level because callers only consume `currState`.
      cb(
        savedPrevState as Extract<State, { type: PrevType }>,
        state as Extract<State, { type: NewType }>
      )
    }

    prevState.current = state
    // prevTest is kept in the signature for documentation but intentionally
    // not depended on — the entry-detection logic doesn't use it.
  }, [cb, newTest, state])
}
