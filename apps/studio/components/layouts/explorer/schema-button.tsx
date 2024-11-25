import { useParams } from 'common'
import { Schema } from 'data/database/schemas-query'
import { Workflow } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn, TreeViewItemVariant } from 'ui'

export function SchemaButton({ schema }: { schema: Schema | undefined }) {
  const { ref } = useParams()
  const { asPath } = useRouter()

  const active = asPath.includes(`/project/${ref}/explorer/schema/${schema?.name}`)

  return (
    <Link
      href={`/project/${ref}/explorer/schema/${schema?.name}?schema=${schema?.name}`}
      className={cn('px-4', TreeViewItemVariant({ isSelected: active }))}
    >
      {active && <div className="absolute left-0 h-full w-0.5 bg-foreground" />}
      <Workflow
        size={14}
        className={cn(active ? 'text-foreground-light' : 'text-foreground-muted')}
      />
      {schema?.name} visualizer
    </Link>
  )
}
