import FlagContext from 'components/ui/Flag/FlagContext'
import { useContext } from 'react'

export function useFlag<T = any>(name: string) {
  const store: any = useContext(FlagContext)

  const isObjectEmpty = (objectName: Object) => {
    return Object.keys(objectName).length === 0
  }

  if (!isObjectEmpty(store) && store[name] === undefined) {
    console.error(`Flag key "${name}" does not exist in flagStore`)
    return false
  }
  return store[name] as T
}
