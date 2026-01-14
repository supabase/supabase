import { useRef } from 'react'

export function useStateTransition<
  State extends { type: string },
  PrevType extends State['type'],
  NewType extends State['type'],
>(
  state: State,
  prevTest: PrevType,
  newTest: NewType,
  cb: (
    prevState: Extract<State, { type: PrevType }>,
    currState: Extract<State, { type: NewType }>
  ) => void
): void {
  const prevState = useRef(state)
  const savedPrevState = prevState.current
  const shouldRunCallback = savedPrevState.type === prevTest && state.type === newTest
  prevState.current = state

  if (shouldRunCallback) {
    cb(
      savedPrevState as Extract<State, { type: PrevType }>,
      state as Extract<State, { type: NewType }>
    )
  }
}
