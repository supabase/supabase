import { Copy } from 'lucide-react'
import { Button, FloatingPlate } from 'ui'

export default function ButtonFloatingPlate() {
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-md border border-border">
      <pre className="bg-surface-100 p-4 pr-16 font-mono text-xs text-foreground-light leading-relaxed">
        {`select *
from projects
where status = 'ACTIVE_HEALTHY'
order by created_at desc
limit 20;`}
      </pre>
      <FloatingPlate className="absolute right-2 top-2">
        <Button size="tiny" icon={<Copy />}>
          Copy
        </Button>
      </FloatingPlate>
    </div>
  )
}
