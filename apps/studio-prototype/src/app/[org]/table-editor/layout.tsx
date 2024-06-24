import TabHeader from './tab-header'
import TableEditorItemsPanel from './table-editor-items-panel'

export default function TableEditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-full w-full">
      <TableEditorItemsPanel />
      <div className="flex flex-col grow h-full w-full">
        <TabHeader />
        {children}
      </div>
    </div>
  )
}
