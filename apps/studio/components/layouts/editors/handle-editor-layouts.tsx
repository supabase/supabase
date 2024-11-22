// Import required hooks and components
import { useFlag } from 'hooks/ui/useFlag'
import dynamic from 'next/dynamic'
import { JSXElementConstructor, ReactElement, Suspense } from 'react'
import { ProjectContextFromParamsProvider } from '../ProjectLayout/ProjectContext'
import { useEditorType } from './editors-layout.hooks'

// Dynamically import layouts to reduce initial bundle size
// These are loaded only when needed
const ExplorerLayout = dynamic(
  () => import('../explorer/layout').then((mod) => mod.ExplorerLayout),
  { ssr: false }
)
const TableEditorLayout = dynamic(() => import('../TableEditorLayout/TableEditorLayout'), {
  ssr: false,
})
const SQLEditorLayout = dynamic(() => import('../SQLEditorLayout/SQLEditorLayout'), {
  ssr: false,
})

/**
 * HandleEditorLayouts is responsible for rendering the appropriate layout based on:
 * 1. Whether the project explorer feature flag is enabled
 * 2. The current route/pathname
 *
 * This component acts as a router-level layout wrapper that ensures the correct
 * navigation structure and context is provided to editor pages (SQL Editor and Table Editor).
 * It dynamically switches between layouts while maintaining consistent project context.
 */
export const HandleEditorLayouts = ({
  children,
}: {
  children: ReactElement<any, string | JSXElementConstructor<any>>
}) => {
  const editor = useEditorType()
  // Check if project explorer feature flag is enabled
  const projectExplorer = useFlag('projectExplorer')

  return (
    <ProjectContextFromParamsProvider>
      <Suspense fallback={null}>
        {projectExplorer ? (
          <ExplorerLayout>{children}</ExplorerLayout>
        ) : editor === 'table-editor' ? (
          <TableEditorLayout>{children}</TableEditorLayout>
        ) : (
          <SQLEditorLayout title="SQL Editor">{children}</SQLEditorLayout>
        )}
      </Suspense>
    </ProjectContextFromParamsProvider>
  )
}
