import { Clock, Database, HardDrive, ListChecks, Lock, Radio, Sparkles, Zap } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from 'ui'

import { SUPABASE_FEATURES, type SupabaseFeature } from '@/data/types'

const FEATURE_ICONS: Record<SupabaseFeature, ComponentType<{ className?: string }>> = {
  database: Database,
  auth: Lock,
  storage: HardDrive,
  realtime: Radio,
  'edge-functions': Zap,
  vectors: Sparkles,
  cron: Clock,
  queues: ListChecks,
}

export function FeatureIcon({
  feature,
  className,
}: {
  feature: SupabaseFeature
  className?: string
}) {
  const Icon = FEATURE_ICONS[feature]
  return <Icon className={className} />
}

interface FeatureBadgeProps {
  feature: SupabaseFeature
  className?: string
}

/** Static pill for a Supabase feature, used on cards and the detail page. */
export function FeatureBadge({ feature, className }: FeatureBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border bg-surface-75 px-2 py-0.5 text-xs text-foreground-light',
        className
      )}
    >
      <FeatureIcon feature={feature} className="size-3" />
      {SUPABASE_FEATURES[feature].label}
    </span>
  )
}
