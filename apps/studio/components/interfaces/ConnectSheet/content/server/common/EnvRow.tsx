export function EnvRow({
  name,
  value,
  children,
}: {
  name: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-x-2 px-4 py-2.5 font-mono text-sm">
      <span className="shrink-0 text-foreground-lighter">{name}=</span>
      <span className="flex-1 truncate text-foreground" title={value}>
        {value}
      </span>
      <div className="flex items-center gap-x-1">{children}</div>
    </div>
  )
}
