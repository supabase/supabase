import 'react-dom'

declare module 'react-dom' {
  function useFormState<State>(
    action: (state: State) => Promise<State>,
    initialState: State,
    permalink?: string
  ): [state: State, dispatch: () => void]
  function useFormState<State, Payload>(
    action: (state: State, payload: Payload) => Promise<State>,
    initialState: State,
    permalink?: string
  ): [state: State, dispatch: (payload: Payload) => void]
}
