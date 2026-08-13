import { ReactNode } from 'react'
import { Badge } from 'ui'

import {
  LISTENING_PORT,
  WORKERS_REGION_LABEL,
  getRuntimeMeta,
  getSizeMeta,
} from '../Workers.constants'
import type { Worker } from '../Workers.types'
import { RuntimeBadge } from '../RuntimeBadge'

interface WorkerSettingsTabProps {
  worker: Worker
}

const SettingsRow = ({
  label,
  children,
  isFirst,
}: {
  label: string
  children: ReactNode
  isFirst?: boolean
}) => (
  <div
    className={`flex items-center justify-between px-4 py-3 ${
      isFirst ? '' : 'border-t border-default'
    }`}
  >
    <span className="text-sm text-foreground-light">{label}</span>
    <span className="text-sm text-foreground">{children}</span>
  </div>
)

/** Read-only Container + Resources view (config is fixed at deploy time). */
export const WorkerSettingsTab = ({ worker }: WorkerSettingsTabProps) => {
  const runtime = getRuntimeMeta(worker.runtime)
  const size = getSizeMeta(worker.size)

  return (
    <div className="max-w-3xl space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm text-foreground">Container</h3>
          <p className="text-sm text-foreground-lighter">
            Sizes are fixed at deploy time. There is no resize — to change size, delete the worker
            and redeploy.
          </p>
        </div>
        <div className="rounded-md border border-default bg-surface-100">
          <SettingsRow label="Runtime" isFirst>
            <RuntimeBadge runtime={worker.runtime} />
          </SettingsRow>
          <SettingsRow label="Base image">
            <span className="font-mono text-xs text-foreground-light">{runtime.baseImage}</span>
          </SettingsRow>
          <SettingsRow label="Entrypoint">
            <span className="font-mono text-xs text-foreground-light">{runtime.entrypoint}</span>
          </SettingsRow>
          <SettingsRow label="Listening port">
            <span className="font-mono text-xs text-foreground-light">
              $PORT → {LISTENING_PORT}
            </span>
          </SettingsRow>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm text-foreground">Resources</h3>
        <div className="rounded-md border border-default bg-surface-100">
          <SettingsRow label="Size" isFirst>
            {size.label}
          </SettingsRow>
          <SettingsRow label="Instances">{worker.instances}</SettingsRow>
          <SettingsRow label="Access">
            {worker.access === 'public' ? (
              <Badge variant="success">Public</Badge>
            ) : (
              <Badge>Private</Badge>
            )}
          </SettingsRow>
          <SettingsRow label="Region">
            <span className="text-foreground-light">
              {WORKERS_REGION_LABEL} <span className="text-foreground-lighter">(locked)</span>
            </span>
          </SettingsRow>
        </div>
      </section>
    </div>
  )
}
