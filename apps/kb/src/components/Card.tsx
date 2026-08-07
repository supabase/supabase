interface CardProps {
  title: string
  description: string
}

export function Card({ title, description }: CardProps) {
  return (
    <div className="rounded-lg border border-default bg-background-surface-100 p-6">
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-foreground-light">{description}</p>
    </div>
  )
}
