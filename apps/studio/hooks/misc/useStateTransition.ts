import { useEffect, useRef } from 'react'

export function useStateTransition<
  State extends { type: string },
  PrevType extends State['type'],
  NewType extends State['type'],
>(
  state: State,
  // Documentary only — the entry-detection logic below intentionally does not
  // require `savedPrevState.type === prevTest`. React 18+ auto-batches
  // dispatches across awaits (e.g. dispatch SUBMIT → await → mutation
  // onError dispatch ERROR), which collapses `prevTest → newTest` into a
  // single render where the intermediate `prevTest` state is never observed,
  // so the previous state may be any variant other than `newTest`. `cb`'s
  // first parameter is typed accordingly.
  _prevTest: PrevType,
  newTest: NewType,
  cb: (
    prevState: Exclude<State, { type: NewType }>,
    currState: Extract<State, { type: NewType }>
  ) => void
): void {
  const prevState = useRef(state)

  useEffect(() => {
    const savedPrevState = prevState.current

    if (savedPrevState.type !== newTest && state.type === newTest) {
      cb(
        savedPrevState as Exclude<State, { type: NewType }>,
        state as Extract<State, { type: NewType }>
      )
    }

    prevState.current = state
  }, [cb, newTest, state])
}
