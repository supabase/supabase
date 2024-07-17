import TableEditorItemsPanel from './table-editor-items-panel'
import TabsHeader from './tabs-header'

export default function TableEditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-full w-full">
      <TableEditorItemsPanel />
      <div className="flex flex-col grow h-full w-full">
        <TabsHeader />
        {children}
      </div>
    </div>
  )
}
