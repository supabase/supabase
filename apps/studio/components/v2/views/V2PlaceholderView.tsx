'use client'

export function V2PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-6 text-foreground-lighter text-sm">
      <h2 className="text-foreground font-medium mb-2">{title}</h2>
      <p>This view will show real data from the API. Placeholder for the v2 prototype.</p>
    </div>
  )
}
