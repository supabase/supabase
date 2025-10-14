import { useCallback, useEffect, useState } from 'react'
import {
  DatabaseBackup,
  DatabaseZap,
  GitBranch,
  Lock,
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
import { Database, EdgeFunctions, Reports, Storage, TableEditor } from 'icons'

export interface QuickActionOption {
  id: string
  label: string
  icon: React.ElementType
  onClick?: () => void
  href?: string
  kbd?: string[]
  badge?: boolean
}

export const useQuickActionOptions: () => {
  allActions: QuickActionOption[]
  selectedActions: QuickActionOption[]
  editQuickActions: boolean
  setEditQuickActions: (value: boolean) => void
  setSelectedActions: (value: QuickActionOption[]) => void
  saveSelectedActions: () => void
} = () => {
  const router = useRouter()
  const { ref } = useParams()
  const snap = useTableEditorStateSnapshot()
  const [selectedActions, setSelectedActions] = useState<QuickActionOption[]>([])
  const [editQuickActions, setEditQuickActions] = useState(false)

  const handleNewTable = useCallback(() => {
    router.push(`/project/${ref}/editor`)
    snap.onAddTable()
  }, [])

  // Load selected actions from localStorage on mount
  useEffect(() => {
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

  const allActions = [
    // Database
    {
      id: 'new-table',
      label: 'New Table',
      icon: TableEditor,
      onClick: handleNewTable,
      kbd: ['c', 't'],
    },
    {
      id: 'database-function',
      label: 'Database Function',
      icon: Database,
      onClick: () => null,
      kbd: ['c', 'd', 'f'],
    },
    {
      id: 'database-trigger',
      label: 'Database Trigger',
      icon: DatabaseZap,
      onClick: () => null,
      kbd: ['c', 'd', 't'],
    },
    {
      id: 'database-index',
      label: 'Database Index',
      icon: TextSearch,
      onClick: () => null,
      kbd: ['c', 'd', 'i'],
    },
    {
      id: 'database-role',
      label: 'Database Role',
      icon: UserCheck,
      onClick: () => null,
      kbd: ['c', 'd', 'r'],
    },
    {
      id: 'database-backup',
      label: 'Database Backup',
      icon: DatabaseBackup,
      onClick: () => null,
      kbd: ['c', 'd', 'b'],
    },
    // {
    //   id: 'database-migration',
    //   label: 'Database Migration',
    //   icon: DatabaseBackup,
    //   onClick: () => null,
    //   kbd: ['c', 'd', 'b'],
    //   badge: 'Coming Soon',
    // },
    {
      id: 'database-webhook',
      label: 'Database Webhook',
      icon: Webhook,
      onClick: () => null,
      kbd: ['c', 'd', 'w'],
    },
    {
      id: 'database-enumerated-type',
      label: 'Enumerated Type',
      icon: Type,
      onClick: () => null,
      kbd: ['c', 'e', 't'],
    },
    // Branching
    {
      id: 'branch',
      label: 'Branch',
      icon: GitBranch,
      onClick: () => null,
      kbd: ['c', 'b'],
    },
    // Auth
    {
      id: 'auth-user',
      label: 'Auth User',
      icon: User2,
      onClick: () => null,
      kbd: ['c', 'u'],
    },
    {
      id: 'rls-policy',
      label: 'RLS Policy',
      icon: Lock,
      onClick: () => null,
      kbd: ['c', 'r'],
    },
    // Storage
    {
      id: 'storage-bucket',
      label: 'Storage Bucket',
      icon: Storage,
      onClick: () => null,
      kbd: ['c', 'b'],
    },
    {
      id: 'storage-bucket-policy',
      label: 'Storage Bucket Policy',
      icon: Storage,
      onClick: () => null,
      kbd: ['c', 'b', 'p'],
    },
    // Edge Functions
    {
      id: 'edge-function',
      label: 'Edge Function',
      icon: EdgeFunctions,
      onClick: () => null,
      kbd: ['c', 'f'],
    },
    // Realtime
    {
      id: 'realtime-rls-policy',
      label: 'Realtime RLS Policy',
      icon: Lock,
      onClick: () => null,
      kbd: ['c', 'r', 'p'],
    },
    // Observability
    {
      id: 'custom-report',
      label: 'Custom Report',
      icon: Reports,
      onClick: () => null,
      kbd: ['c', 'r'],
    },
    // Extentions, if enabled
    {
      id: 'vault-secret',
      label: 'Vault Secret',
      icon: Vault,
      onClick: () => null,
      kbd: ['c', 'v', 's'],
    },
  ]

  return {
    allActions,
    selectedActions,
    setSelectedActions,
    editQuickActions,
    setEditQuickActions,
    saveSelectedActions,
  }
}
