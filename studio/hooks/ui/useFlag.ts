import { useContext } from 'react'
import FlagContext from 'components/ui/Flag/FlagContext'

export function useFlag(name: string) {
  const store: any = useContext(FlagContext)
  return store[name]
}
