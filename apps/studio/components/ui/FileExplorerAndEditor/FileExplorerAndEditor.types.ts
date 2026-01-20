export type FileData = {
  id: number
  name: string
  content: string
  selected?: boolean
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
