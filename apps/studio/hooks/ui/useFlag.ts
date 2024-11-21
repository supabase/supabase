import { useContext } from 'react'
import FlagContext from 'components/ui/Flag/FlagContext'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

export function useFlag<T = boolean>(name: string) {
  const project = useSelectedProject()
  const store: any = useContext(FlagContext)

  // Temporary override as Fly projects are cant seem to upgrade their compute with the new disk UI
  if (name === 'diskAndComputeForm' && project?.cloud_provider === 'FLY') {
    return false
  }

  const isObjectEmpty = (objectName: Object) => {
    return Object.keys(objectName).length === 0
  }

  if (!isObjectEmpty(store) && store[name] === undefined) {
    console.error(`Flag key "${name}" does not exist in flagStore`)
    return false
  }
  return store[name] as T
}
