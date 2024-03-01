export type projectKeys = {
  apiUrl: string | null
  anonKey: string | null
}

export interface ContentFileProps {
  region?: string
  projectRef?: string
  projectKeys: {
    apiUrl: string
    anonKey: string
  }
}
