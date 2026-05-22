import { createContext, useCallback, useContext, useRef, type PropsWithChildren } from 'react'

type InsertVariableFn = (text: string) => void

interface EmailTemplateEditorContextValue {
  insertVariable: InsertVariableFn
  registerInsertVariable: (fn: InsertVariableFn) => void
}

const EmailTemplateEditorContext = createContext<EmailTemplateEditorContextValue | null>(null)

export const EmailTemplateEditorProvider = ({ children }: PropsWithChildren) => {
  const insertVariableRef = useRef<InsertVariableFn>(() => {})

  const registerInsertVariable = useCallback((fn: InsertVariableFn) => {
    insertVariableRef.current = fn
  }, [])

  const insertVariable = useCallback((text: string) => {
    insertVariableRef.current(text)
  }, [])

  return (
    <EmailTemplateEditorContext
      value={{
        insertVariable,
        registerInsertVariable,
      }}
    >
      {children}
    </EmailTemplateEditorContext>
  )
}

export const useEmailTemplateEditor = () => {
  const context = useContext(EmailTemplateEditorContext)
  if (!context) {
    throw new Error('useEmailTemplateEditor must be used within EmailTemplateEditorProvider')
  }
  return context
}
