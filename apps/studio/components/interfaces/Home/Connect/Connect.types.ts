export type projectKeys = {
  apiUrl: string | null
  anonKey: string | null
}

export interface ContentFileProps {
  projectKeys: {
    apiUrl: string
    anonKey: string
  }
  connectionStringPooler: {
    transaction: string
    session: string
  }
  connectionStringDirect: string
}
