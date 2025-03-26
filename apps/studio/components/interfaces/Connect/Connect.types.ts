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
    transactionShared: string
    sessionShared: string
    transactionDedicated?: string
    sessionDedicated?: string
    ipv4SupportedForDedicatedPooler: boolean
  }
}
