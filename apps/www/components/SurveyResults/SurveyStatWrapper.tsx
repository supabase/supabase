export function SurveyStatWrapper({ children }: { children: React.ReactNode }) {
  return (
    <aside className="flex flex-row md:flex-col md:self-start divide-x md:divide-y bg-surface-100 border border-default rounded-md ">
      {children}
    </aside>
  )
}
