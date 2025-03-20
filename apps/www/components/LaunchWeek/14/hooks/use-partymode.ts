import useLw14ConfData from "./use-conf-data"

export const usePartymode = () => {
  const [state, dispatch] = useLw14ConfData()

  return {
    state: state.partyModeState,
    toggle: () => {
      if(state.partyModeState === 'on') {
        dispatch({ type: 'PARTYMODE_DISABLE' })
      } else {
        dispatch({ type: 'PARTYMODE_ENABLE' })
      }
    }
  }
}

