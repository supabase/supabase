export type FileData = {
  id: number
  name: string
  content: string
  state: 'new' | 'modified' | 'unchanged'
}

export enum FileAction {
  CREATE_NEW = 'CREATE_NEW',
  REPLACE_EXISTING = 'REPLACE_EXISTING',
  REPLACE_NEW = 'REPLACE_NEW',
}

export type FileActionResult =
  | { action: FileAction.CREATE_NEW }
  | { action: FileAction.REPLACE_EXISTING; index: number }
  | { action: FileAction.REPLACE_NEW; index: number }

export type TreeChildData = {
  id: string
  name: string
  metadata: {
    isEditing: boolean
    originalId: number
    state: FileData['state']
  }
}
