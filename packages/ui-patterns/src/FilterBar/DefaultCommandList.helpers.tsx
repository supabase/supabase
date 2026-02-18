export function EmptyState() {
  return <div className="py-6 text-center text-sm text-foreground-muted">No results found.</div>
}

export function GroupHeader({ label }: { label: string }) {
  return (
    <div className="px-2 py-1.5 text-xs text-foreground-lighter font-medium tracking-wide">
      {label}
    </div>
  )
}

export function GroupSeparator() {
  return <div className="h-px bg-border-muted my-1" />
}
