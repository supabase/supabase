import { createFileRoute, Outlet } from '@tanstack/react-router'

import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import { TableEditorLayout } from '@/components/layouts/TableEditorLayout/TableEditorLayout'
import { TableEditorMenu } from '@/components/layouts/TableEditorLayout/TableEditorMenu'

export const Route = createFileRoute('/project/$ref/editor')({
  component: TableEditorShell,
})

// All three editor leaves (index, $id, new) share identical layout
// wrapping in the Next pages router (DefaultLayout > EditorBaseLayout >
// TableEditorLayout). DefaultLayout is provided by the parent
// `routes/project/$ref.tsx` shell, so this file only adds the
// editor-specific layers.
//
// Note on the ProjectLayoutWithAuth chain: EditorBaseLayout always
// wraps in <ProjectLayoutWithAuth>. TableEditorLayout *also* wraps in
// one — but only on its no-permission path; the happy path returns
// `<>{children}<SaveQueueActionBar/></>` so no double-wrap occurs in
// normal use. Mirrors current Next behaviour exactly.
function TableEditorShell() {
  return (
    <EditorBaseLayout
      productMenu={<TableEditorMenu />}
      product="Table Editor"
      productMenuClassName="overflow-y-hidden"
    >
      <TableEditorLayout>
        <Outlet />
      </TableEditorLayout>
    </EditorBaseLayout>
  )
}
