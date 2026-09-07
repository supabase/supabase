import { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'ui'
import { copyToClipboard } from 'ui'
import type { CreatedProject } from '@/data/projects/create-project-mutation'

interface CredentialsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: CreatedProject | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copyToClipboard(text, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 flex-shrink-0 text-foreground-light hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
    </button>
  )
}

export function CredentialsModal({ open, onOpenChange, project }: CredentialsModalProps) {
  if (!project) return null

  const envBlock = project.env_vars.join('\n')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>"{project.name}" created</DialogTitle>
          <DialogDescription>
            Save these credentials now — they won't be shown again.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          {/* Credentials table */}
          <div className="rounded-md border border-muted overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: 'Reference ID', value: project.ref },
                  { label: 'Host', value: project.host },
                  { label: 'Database', value: project.database },
                  { label: 'Password', value: project.credentials.password, mono: true, sensitive: true },
                  { label: 'JWT Secret', value: project.credentials.jwt_secret, mono: true, sensitive: true },
                ].map(({ label, value, mono, sensitive }) => (
                  <tr key={label} className="border-b border-muted last:border-0">
                    <td className="px-3 py-2 text-foreground-light w-36 bg-surface-100">{label}</td>
                    <td className="px-3 py-2 font-mono text-foreground break-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
                        <CopyButton text={value} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* .env block */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground-light flex items-center gap-1.5">
                <Terminal size={14} />
                Add to your <code className="text-xs bg-surface-200 px-1 rounded">.env</code> file
              </p>
              <CopyButton text={envBlock} />
            </div>
            <pre className="rounded-md bg-surface-100 border border-muted px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre text-foreground">
              {envBlock}
            </pre>
          </div>

          {/* Next steps */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-foreground-light">Next steps</p>
            <ol className="flex flex-col gap-1.5 text-sm">
              {project.next_steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-foreground-light">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {project.generator_errors && project.generator_errors.length > 0 && (
            <div className="rounded-md bg-warning-200 border border-warning-400 px-3 py-2 text-sm text-warning-600">
              <p className="font-semibold mb-1">Generator warnings</p>
              {project.generator_errors.map((e, i) => (
                <p key={i} className="font-mono text-xs">{e}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button size="small" onClick={() => onOpenChange(false)}>
              I've saved my credentials
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}