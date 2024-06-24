import TableEditorItemsPanel from './table-editor-items-panel'

export default function TableEditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-full w-full">
      <TableEditorItemsPanel />
      {children}
    </div>
  )
}
