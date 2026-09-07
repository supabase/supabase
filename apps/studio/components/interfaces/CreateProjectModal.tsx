import { useState } from 'react'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
} from 'ui'
import { useCreateProject, type CreatedProject } from '@/data/projects/create-project-mutation'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (project: CreatedProject) => void
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function generatePassword(length = 20): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join('')
}

export function CreateProjectModal({ open, onOpenChange, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [refOverride, setRefOverride] = useState('')
  const [password, setPassword] = useState(() => generatePassword())
  const [showPassword, setShowPassword] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const derivedRef = refOverride.trim() || generateSlug(name)

  const { mutate: createProject, isPending } = useCreateProject({
    onSuccess: (data) => {
      onCreated(data)
      onOpenChange(false)
      // Reset form
      setName('')
      setRefOverride('')
      setPassword(generatePassword())
      setShowAdvanced(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createProject({ name: name.trim(), ref: derivedRef || undefined, password })
  }

  const isValid = name.trim().length >= 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New database</DialogTitle>
          <DialogDescription>
            Create a new isolated PostgreSQL database with its own auth, storage, and REST API.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              placeholder="My App"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isPending}
            />
            {name.trim().length >= 2 && (
              <p className="text-xs text-foreground-light">
                Reference ID: <span className="font-mono">{derivedRef}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-password">Database password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="project-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono pr-10"
                  disabled={isPending}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-light hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button
                type="button"
                size="small"
                icon={<RefreshCw size={14} />}
                onClick={() => setPassword(generatePassword())}
                disabled={isPending}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-foreground-light">
              Save this password — you won't be able to retrieve it later.
            </p>
          </div>

          {/* Advanced */}
          <div>
            <button
              type="button"
              className="text-xs text-foreground-light hover:text-foreground underline"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced options
            </button>
            {showAdvanced && (
              <div className="flex flex-col gap-1.5 mt-3">
                <Label htmlFor="project-ref">Custom reference ID</Label>
                <Input
                  id="project-ref"
                  placeholder={derivedRef || 'my-app'}
                  value={refOverride}
                  onChange={(e) => setRefOverride(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="font-mono"
                  disabled={isPending}
                />
                <p className="text-xs text-foreground-light">
                  Used in URLs and container names. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="small"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              disabled={!isValid || isPending}
              loading={isPending}
            >
              Create database
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}