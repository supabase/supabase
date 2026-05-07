import { motion } from 'framer-motion'
import { BaggageClaim, BookOpen } from 'lucide-react'
import { Button } from 'ui'

// not in use yet
export const MigrateToPostgres = () => (
  <motion.div
    className="w-full rounded-lg overflow-hidden relative border border-muted"
    variants={{
      hidden: { opacity: 0, scale: 0.96, y: 15 },
      show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 600,
          damping: 50,
          staggerChildren: 0.08,
          delayChildren: 0.03,
        },
      },
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-background-surface-200 via-background-surface-200 to-transparent"></div>
    <div className="relative z-10 px-5 py-4 h-full flex gap-5 items-center justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-300 border">
            <BaggageClaim size={14} className="text-foreground-light" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base text-foreground">Migrate your Database to Postgres</h2>
            <p className="text-xs text-foreground-light max-w-md">
              Already have a database? Migrate any database to Supabase to access backups, RESTful
              auto APIs, Authentication and more.
            </p>
          </div>
        </div>
      </div>
      <Button type="default" className="rounded-full" iconRight={<BookOpen />}>
        Migrate to Postgres
      </Button>
    </div>
  </motion.div>
)
