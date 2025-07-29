export function SurveyStatWrapper({ children }: { children: React.ReactNode }) {
  return (
    <aside className="flex flex-row divide-x bg-surface-100 border border-default rounded-md">
      {children}
    </aside>
  )
}
