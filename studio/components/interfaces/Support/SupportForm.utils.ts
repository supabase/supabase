export function formReducer(state: any, action: any) {
  return {
    ...state,
    [action.name]: {
      value: action.value,
      error: action.error,
    },
  }
}
