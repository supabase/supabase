import { useState, useCallback, useRef } from 'react'
import { RLSSimulationContext } from 'data/rls-playground'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  cn,
} from 'ui'

interface RLSContextEditorProps {
  context: RLSSimulationContext
  onContextChange: (context: RLSSimulationContext) => void
  availableRoles: string[]
}

export const RLSContextEditor = ({
  context,
  onContextChange,
  availableRoles,
}: RLSContextEditorProps) => {
  const [jwtText, setJwtText] = useState(
    JSON.stringify(context.jwtClaims ?? {}, null, 2)
  )
  const [jwtError, setJwtError] = useState<string | null>(null)
  
  // Track if we should notify parent (avoid loops)
  const isInternalChange = useRef(false)

  // Handle JWT text changes with debounced parsing
  const handleJwtTextChange = useCallback((text: string) => {
    setJwtText(text)
    try {
      const parsed = JSON.parse(text)
      setJwtError(null)
      // Only notify parent if this is a user edit
      if (!isInternalChange.current) {
        onContextChange({
          ...context,
          jwtClaims: parsed,
          userId: parsed.sub,
        })
      }
    } catch (e) {
      setJwtError('Invalid JSON')
    }
  }, [context, onContextChange])

  const handleRoleChange = useCallback((role: string) => {
    // Update JWT claims role to match selected role
    const updatedClaims = {
      ...context.jwtClaims,
      role,
    }
    isInternalChange.current = true
    setJwtText(JSON.stringify(updatedClaims, null, 2))
    isInternalChange.current = false
    onContextChange({
      ...context,
      role,
      jwtClaims: updatedClaims,
    })
  }, [context, onContextChange])

  // Preset templates for common scenarios
  const presets = [
    {
      name: 'Anonymous User',
      context: {
        role: 'anon',
        jwtClaims: {
          role: 'anon',
        },
      },
    },
    {
      name: 'Authenticated User',
      context: {
        role: 'authenticated',
        jwtClaims: {
          sub: 'user-123',
          role: 'authenticated',
          email: 'user@example.com',
          app_metadata: {},
          user_metadata: {},
        },
      },
    },
    {
      name: 'Admin User',
      context: {
        role: 'authenticated',
        jwtClaims: {
          sub: 'admin-456',
          role: 'authenticated',
          email: 'admin@example.com',
          app_metadata: {
            role: 'admin',
          },
          user_metadata: {
            is_admin: true,
          },
        },
      },
    },
    {
      name: 'Service Role',
      context: {
        role: 'service_role',
        jwtClaims: {
          role: 'service_role',
        },
      },
    },
  ]

  const applyPreset = useCallback((preset: (typeof presets)[0]) => {
    isInternalChange.current = true
    setJwtText(JSON.stringify(preset.context.jwtClaims, null, 2))
    isInternalChange.current = false
    onContextChange(preset.context)
  }, [onContextChange])

  return (
    <div className="flex flex-col gap-4">
      {/* Role Selection */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="role-select">Database Role</Label>
        <Select value={context.role} onValueChange={handleRoleChange}>
          <SelectTrigger id="role-select">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-2">
        <Label>Quick Presets</Label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                'hover:bg-surface-200 hover:border-foreground-muted',
                context.role === preset.context.role &&
                  JSON.stringify(context.jwtClaims) ===
                    JSON.stringify(preset.context.jwtClaims)
                  ? 'bg-surface-200 border-foreground-muted'
                  : 'bg-surface-100 border-border'
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* JWT Claims Editor */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="jwt-editor">
          JWT Claims (request.jwt.claims)
          {jwtError && (
            <span className="text-destructive ml-2 text-xs">{jwtError}</span>
          )}
        </Label>
        <div className="border rounded-md overflow-hidden h-[200px]">
          <textarea
            id="jwt-editor"
            value={jwtText}
            onChange={(e) => handleJwtTextChange(e.target.value)}
            className={cn(
              'w-full h-full p-3 font-mono text-sm resize-none',
              'bg-surface-100 text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-brand',
              jwtError && 'border-destructive'
            )}
            spellCheck={false}
          />
        </div>
        <p className="text-xs text-foreground-lighter">
          These claims will be available as <code>auth.jwt()</code> in your
          policies. The <code>sub</code> field maps to <code>auth.uid()</code>.
        </p>
      </div>
    </div>
  )
}
