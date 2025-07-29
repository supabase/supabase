export function SurveyStatCard({
  number,
  unit = '%',
  label,
}: {
  number: number
  unit?: string
  label: string
}) {
  return (
    <div className="flex-1 px-6 py-8">
      <p className="md:mt-8 text:2xl md:text-3xl lg:text-6xl font-mono text-brand">
        {number}
        {unit}
      </p>
      <p className="text-foreground-light text-sm">{label}</p>
    </div>
  )
}
