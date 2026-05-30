interface Metadata {
  [key: string]: string | number | Object | Object[] | any
}

export interface CustomLogData {
  [other: string]: unknown
}

export interface PreviewLogData extends CustomLogData {
  id: string
  timestamp: number
  message: string
  metadata?: Metadata
}
export type LogData = CustomLogData & PreviewLogData
