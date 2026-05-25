'use client'

import { AlertTriangle, FileCode, Package, X } from 'lucide-react'
import { Badge, Button, Separator } from 'ui'

import type { DependencyResolution, MergedFile, MergeResult } from '../lib/composer'

interface CompositionSummaryProps {
  selectedIds: Set<string>
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  onRemoveTemplate: (id: string) => void
  onViewFile: (file: MergedFile) => void
}

export function CompositionSummary({
  selectedIds,
  resolution,
  mergeResult,
  onRemoveTemplate,
  onViewFile,
}: CompositionSummaryProps) {
  if (resolution.resolved.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
            <Package className="h-8 w-8 text-foreground-muted" />
          </div>
          <h2 className="text-lg font-medium">No templates selected</h2>
          <p className="mt-1 text-sm text-foreground-light">
            Add templates from the browser to generate a project composition.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
            Selected Templates
          </h3>
          <div className="space-y-1">
            {resolution.resolved.map((template) => {
              const isExplicit = selectedIds.has(template.id)

              return (
                <div
                  key={template.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-surface-75 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{template.name}</span>
                      <span className="text-xs text-foreground-light">
                        {template.files.length} file{template.files.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-foreground-light">
                      {template.description}
                    </p>
                  </div>
                  {isExplicit ? (
                    <Button
                      type="text"
                      size="tiny"
                      className="h-7 w-7 shrink-0 px-1"
                      icon={<X className="h-3.5 w-3.5" />}
                      onClick={() => onRemoveTemplate(template.id)}
                      aria-label={`Remove ${template.name}`}
                    />
                  ) : (
                    <Badge variant="warning" className="shrink-0">
                      Auto
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {resolution.missingDeps.length > 0 ? (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-warning">
                <AlertTriangle className="h-3 w-3" />
                Missing Dependencies
              </h3>
              <div className="space-y-1 text-xs text-warning">
                {resolution.missingDeps.map((dependencyId) => (
                  <p key={dependencyId}>Could not find required template `{dependencyId}`.</p>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {mergeResult ? (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                Output Files ({mergeResult.files.length})
              </h3>
              <div className="space-y-1">
                {mergeResult.files.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-100"
                    onClick={() => onViewFile(file)}
                  >
                    <FileCode className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
                    <code className="min-w-0 flex-1 truncate text-xs">{file.path}</code>
                    {file.sources.length > 1 ? (
                      <Badge className="shrink-0">{file.sources.length} merged</Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {mergeResult && mergeResult.warnings.length > 0 ? (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-warning">
                <AlertTriangle className="h-3 w-3" />
                Warnings ({mergeResult.warnings.length})
              </h3>
              <div className="space-y-1 text-xs text-warning">
                {mergeResult.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
