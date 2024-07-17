import SettingsMenuPanel from '../settings-menu-panel'

export default function TableEditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex h-full">
        <div>{children}</div>
      </div>
    </div>
  )
}
