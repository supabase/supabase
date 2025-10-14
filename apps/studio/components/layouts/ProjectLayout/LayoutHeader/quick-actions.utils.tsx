import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DatabaseBackup,
  DatabaseZap,
  FunctionSquare,
  GitBranch,
  Lock,
  Network,
  TextSearch,
  Type,
  User2,
  UserCheck,
  Vault,
  Webhook,
} from 'lucide-react'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { EdgeFunctions, Reports, Storage, TableEditor } from 'icons'
import { useAppStateSnapshot } from '../../../../state/app-state'
import { useSendEventMutation } from '../../../../data/telemetry/send-event-mutation'

export interface QuickActionOption {
  id: string
  label: string
  icon: React.ElementType
  onClick?: (context?: { organization?: string; triggerMethod?: string }) => void
  href?: string
  kbd?: string[]
  badge?: boolean
}

// Custom hook for keyboard shortcut detection
export const useKeyboardShortcuts = (
  actions: QuickActionOption[],
  enabled: boolean = true,
  context?: { organization?: string }
) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [sequence, setSequence] = useState<string[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const normalizeKey = (key: string): string => {
    // Normalize key names for consistent matching
    const keyMap: Record<string, string> = {
      Control: 'ctrl',
      Meta: 'cmd',
      Alt: 'alt',
      Shift: 'shift',
      ' ': 'space',
      Enter: 'enter',
      Escape: 'escape',
      Backspace: 'backspace',
      Tab: 'tab',
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    }
    return keyMap[key] || key.toLowerCase()
  }

  const isFormElement = (element: Element): boolean => {
    const formElements = ['input', 'textarea', 'select', 'button']
    const isFormElement = formElements.includes(element.tagName.toLowerCase())
    const isContentEditable = element.getAttribute('contenteditable') === 'true'
    const isCodeEditor =
      element.closest('[data-lexical-editor]') ||
      element.closest('.monaco-editor') ||
      element.closest('[data-testid="sql-editor"]') ||
      element.closest('.cm-editor')

    return isFormElement || isContentEditable || !!isCodeEditor
  }

  const checkSimultaneousMatch = useCallback(
    (keys: Set<string>) => {
      return actions.find((action) => {
        if (!action.kbd || action.kbd.length === 0) return false

        const actionKeys = new Set(action.kbd.map((k) => normalizeKey(k)))
        const pressedKeysSet = new Set(Array.from(keys).map((k) => normalizeKey(k)))

        // Check if all action keys are pressed
        return (
          actionKeys.size === pressedKeysSet.size &&
          Array.from(actionKeys).every((key) => pressedKeysSet.has(key))
        )
      })
    },
    [actions]
  )

  const checkSequentialMatch = useCallback(
    (seq: string[]) => {
      return actions.find((action) => {
        if (!action.kbd || action.kbd.length === 0) return false

        const actionKeys = action.kbd.map((k) => normalizeKey(k))
        const normalizedSeq = seq.map((k) => normalizeKey(k))

        // Check if sequence matches action keys
        return (
          actionKeys.length === normalizedSeq.length &&
          actionKeys.every((key, index) => key === normalizedSeq[index])
        )
      })
    },
    [actions]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't listen if disabled or if user is typing in a form field
      if (!enabled || isFormElement(event.target as Element)) {
        return
      }

      const key = normalizeKey(event.key)

      // Ignore modifier keys when checking sequences
      if (['ctrl', 'cmd', 'alt', 'shift'].includes(key)) {
        return
      }

      // Add to pressed keys for simultaneous detection
      setPressedKeys((prev) => new Set([...prev, key]))

      // Add to sequence for sequential detection
      setSequence((prev) => [...prev, key])

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout for sequence reset
      timeoutRef.current = setTimeout(() => {
        setSequence([])
      }, 2000)
    },
    [enabled]
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const key = normalizeKey(event.key)
      setPressedKeys((prev) => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    },
    [enabled]
  )

  // Check for matches on key press
  useEffect(() => {
    if (!enabled) return

    // Check simultaneous match
    const simultaneousMatch = checkSimultaneousMatch(pressedKeys)
    if (simultaneousMatch?.onClick) {
      simultaneousMatch.onClick({
        organization: context?.organization,
        triggerMethod: 'keyboard',
      })
      setPressedKeys(new Set())
      return
    }

    // Check sequential match
    const sequentialMatch = checkSequentialMatch(sequence)
    if (sequentialMatch?.onClick) {
      sequentialMatch.onClick({
        organization: context?.organization,
        triggerMethod: 'keyboard',
      })
      setSequence([])
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [pressedKeys, sequence, checkSimultaneousMatch, checkSequentialMatch, enabled])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleKeyDown, handleKeyUp, enabled])

  // Return functions to control the hook
  return {
    clearSequence: () => {
      setSequence([])
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    },
    clearPressedKeys: () => setPressedKeys(new Set()),
    reset: () => {
      setSequence([])
      setPressedKeys(new Set())
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    },
  }
}

export const useQuickActionOptions: (context?: { organization?: string }) => {
  allActions: QuickActionOption[]
  selectedActions: QuickActionOption[]
  editQuickActions: boolean
  setEditQuickActions: (value: boolean) => void
  setSelectedActions: (value: QuickActionOption[]) => void
  saveSelectedActions: () => void
  resetSelectedActions: () => void
  keyboardShortcuts: {
    clearSequence: () => void
    clearPressedKeys: () => void
    reset: () => void
  }
} = (context) => {
  const { mutate: sendEvent } = useSendEventMutation()
  const [selectedActions, setSelectedActions] = useState<QuickActionOption[]>([])
  const [editQuickActions, setEditQuickActions] = useState(false)
  const router = useRouter()
  const { ref } = useParams()
  const projectRef = ref ?? '_'
  const keyboardShortcuts = useKeyboardShortcuts(selectedActions, !editQuickActions, context)

  const tableEditorStateSnap = useTableEditorStateSnapshot()
  const appStateSnap = useAppStateSnapshot()

  // Wrapper function to add telemetry to action onClick handlers
  const createActionWithTelemetry = useCallback(
    (action: QuickActionOption) => {
      return (context?: { organization?: string; triggerMethod?: string }) => {
        sendEvent({
          action: 'quick_actions_option_selected',
          properties: {
            action: action.id,
            selectionMethod: context?.triggerMethod || 'unknown',
          },
          groups: {
            project: projectRef,
            organization: context?.organization || 'Unknown',
          },
        })

        // Call the original onClick function
        if (action.onClick) {
          action.onClick(context)
        }
      }
    },
    [sendEvent, projectRef]
  )

  const resetSelectedActions = useCallback(() => {
    const savedActions = localStorage.getItem('quick-actions-selected')
    if (savedActions) {
      try {
        const parsedActions = JSON.parse(savedActions)
        const validActions = parsedActions
          .map((id: string) => allActions.find((action) => action.id === id))
          .filter((action: QuickActionOption | undefined) => action !== undefined)
        setSelectedActions(validActions)
      } catch (error) {
        console.error('Failed to parse saved quick actions:', error)
        // Fallback to default visible actions
        setSelectedActions(() =>
          defaultVisible
            .map((x) => allActions.find((y) => y.id === x))
            .filter((x) => x !== undefined)
        )
      }
    } else {
      // No saved actions, use default
      setSelectedActions(() =>
        defaultVisible.map((x) => allActions.find((y) => y.id === x)).filter((x) => x !== undefined)
      )
    }
  }, [])

  // Load selected actions from localStorage on mount
  useEffect(() => {
    resetSelectedActions()
  }, [])

  const saveSelectedActions = useCallback(() => {
    const actionIds = selectedActions.map((action) => action.id)
    localStorage.setItem('quick-actions-selected', JSON.stringify(actionIds))
  }, [selectedActions])

  const defaultVisible = [
    'new-table',
    'rls-policy',
    'storage-bucket',
    'edge-function',
    'custom-report',
  ]

  const allActionsRaw = [
    // Database
    {
      id: 'new-table',
      label: 'New Table',
      icon: TableEditor,
      onClick: () => {
        router.push(`/project/${projectRef}/editor`)
        tableEditorStateSnap.onAddTable()
      },
      kbd: ['c', 't'],
    },
    {
      id: 'database-schema',
      label: 'Database Schema',
      icon: Network,
      kbd: ['c', 'd', 's'],
    },
    {
      id: 'database-function',
      label: 'Database Function',
      icon: FunctionSquare,
      kbd: ['c', 'd', 'f'],
    },
    {
      id: 'database-trigger',
      label: 'Database Trigger',
      icon: DatabaseZap,
      kbd: ['c', 'd', 't'],
    },
    {
      id: 'database-index',
      label: 'Database Index',
      icon: TextSearch,
      kbd: ['c', 'd', 'i'],
    },
    {
      id: 'database-role',
      label: 'Database Role',
      icon: UserCheck,
      kbd: ['c', 'd', 'r'],
    },
    {
      id: 'database-backup',
      label: 'Database Backup',
      icon: DatabaseBackup,
      kbd: ['c', 'd', 'b'],
    },
    {
      id: 'database-webhook',
      label: 'Database Webhook',
      icon: Webhook,
      kbd: ['c', 'd', 'w'],
    },
    {
      id: 'database-sql-snippet',
      label: 'SQL Snippet',
      icon: Webhook,
      onClick: () => router.push(`/project/${projectRef}/sql/new`),
      kbd: ['c', 'd', 's'],
    },
    {
      id: 'database-enumerated-type',
      label: 'Enumerated Type',
      icon: Type,
      kbd: ['c', 'e', 't'],
    },
    // Branching
    {
      id: 'branch',
      label: 'Branch',
      icon: GitBranch,
      onClick: () => appStateSnap.setShowCreateBranchModal(true),
      kbd: ['c', 'b'],
    },
    // Auth
    {
      id: 'auth-user',
      label: 'Auth User',
      icon: User2,
      kbd: ['c', 'u'],
    },
    {
      id: 'rls-policy',
      label: 'RLS Policy',
      icon: Lock,
      kbd: ['c', 'r'],
    },
    // Storage
    {
      id: 'storage-bucket',
      label: 'Storage Bucket',
      icon: Storage,
      kbd: ['c', 's', 'b'],
    },
    {
      id: 'storage-bucket-policy',
      label: 'Storage Bucket Policy',
      icon: Storage,
      kbd: ['c', 'b', 'p'],
    },
    // Edge Functions
    {
      id: 'edge-function',
      label: 'Edge Function',
      icon: EdgeFunctions,
      onClick: () => router.push(`/project/${projectRef}/functions/new`),
      kbd: ['c', 'f'],
    },
    // Realtime
    {
      id: 'realtime-rls-policy',
      label: 'Realtime RLS Policy',
      icon: Lock,
      kbd: ['c', 'r', 'p'],
    },
    // Observability
    {
      id: 'custom-report',
      label: 'Custom Report',
      icon: Reports,
      kbd: ['c', 'r'],
    },
    // Extensions, if enabled (TODO)
    {
      id: 'vault-secret',
      label: 'Vault Secret',
      icon: Vault,
      kbd: ['c', 'v', 's'],
    },
  ]

  // Wrap all actions with telemetry
  const allActions = allActionsRaw.map((action) => ({
    ...action,
    onClick: createActionWithTelemetry(action),
  }))

  return {
    allActions,
    selectedActions,
    setSelectedActions,
    editQuickActions,
    setEditQuickActions,
    saveSelectedActions,
    resetSelectedActions,
    keyboardShortcuts,
  }
}
