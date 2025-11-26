import { DatabaseBackup } from 'lucide-react'

export const BackupsEmpty = () => {
  return (
    <aside className=" border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-3 items-center text-center text-balance">
      <DatabaseBackup size={24} strokeWidth={1.5} className="text-foreground-muted" />

      <div className="flex flex-col items-center text-center">
        <h3>No backups yet</h3>
        <p className="text-foreground-light text-sm">Check again tomorrow.</p>
      </div>
    </aside>
  )
}
