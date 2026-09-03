import { SQLEditorProvider } from './SQLEditorContext'
import { SQLEditorControllersProvider } from './SQLEditorControllers'
import { SQLEditorLayout } from './SQLEditorLayout'

export const SQLEditor = () => (
  <SQLEditorProvider>
    <SQLEditorControllersProvider>
      <SQLEditorLayout />
    </SQLEditorControllersProvider>
  </SQLEditorProvider>
)
