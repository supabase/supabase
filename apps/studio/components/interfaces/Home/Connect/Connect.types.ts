export type projectKeys = {
  apiUrl: string | null
  anonKey: string | null
}

export interface ContentFileProps {
  projectRef?: string
  projectKeys: {
    apiUrl: string
    anonKey: string
  }
}
