import { useLocalStorage } from 'react-use'

// TODO: temporary dev toggle — remove once env var bindings are stable
const KEY = 'studio:env-var-bindings-enabled'

export function useEnvVarBindings() {
  const [enabled, setEnabled] = useLocalStorage(KEY, true)
  return { enabled: enabled ?? true, setEnabled }
}
