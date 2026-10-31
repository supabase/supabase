import { createFileRoute, Outlet } from '@tanstack/react-router'

import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from '@/components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from '@/components/layouts/SQLEditorLayout/SQLEditorMenu'

export const Route = createFileRoute('/project/$ref/sql')({
  component: SQLEditorShell,
})

// Twin of routes/project/$ref/editor.tsx — all four sql/* leaves share
// identical layout wrapping (`<DefaultLayout><EditorBaseLayout productMenu>
// <SQLEditorLayout>{page}</SQLEditorLayout></EditorBaseLayout>`), so the
// shell hardcodes the props with no staticData overrides. DefaultLayout
// is provided by the parent `routes/project/$ref.tsx` shell.
//
// EditorBaseLayout wraps in <ProjectLayoutWithAuth>; SQLEditorLayout adds
// its own `withAuth` HOC but doesn't add another ProjectLayout — so no
// double-render concerns, only doubled auth check (a no-op when already
// authenticated).
function SQLEditorShell() {
  return (
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>
        <Outlet />
      </SQLEditorLayout>
    </EditorBaseLayout>
  )
}
