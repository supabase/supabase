import { createContext, useContext, useState, type PropsWithChildren } from 'react'

interface AssistantToolApprovalContextValue {
  edgeFunctionReplaceWarning: boolean
  setEdgeFunctionReplaceWarning: (value: boolean) => void
}

const AssistantToolApprovalContext = createContext<AssistantToolApprovalContextValue | null>(null)

export function AssistantToolApprovalProvider({ children }: PropsWithChildren) {
  const [edgeFunctionReplaceWarning, setEdgeFunctionReplaceWarning] = useState(false)

  return (
    <AssistantToolApprovalContext.Provider
      value={{ edgeFunctionReplaceWarning, setEdgeFunctionReplaceWarning }}
    >
      {children}
    </AssistantToolApprovalContext.Provider>
  )
}

export function useAssistantToolApproval() {
  const context = useContext(AssistantToolApprovalContext)

  if (!context) {
    throw new Error('useAssistantToolApproval must be used within AssistantToolApprovalProvider')
  }

  return context
}

export function useAssistantToolApprovalOptional() {
  return useContext(AssistantToolApprovalContext)
}
