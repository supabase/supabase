import { stat } from 'fs/promises'

const existsFile = async (fullPath: string) => {
  try {
    await stat(fullPath)
    return true
  } catch {
    return false
  }
}

export { existsFile }
