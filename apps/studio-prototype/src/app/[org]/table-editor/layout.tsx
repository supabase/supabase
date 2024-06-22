import TableEditorItemsPanel from './table-editor-items-panel'

export default function TableEditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <TableEditorItemsPanel />
      <div>{children}</div>
    </>
  )
}
