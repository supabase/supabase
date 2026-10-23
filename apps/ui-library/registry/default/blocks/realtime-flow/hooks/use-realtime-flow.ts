'use client'

import { type SupabasePersistenceOptions, SupabaseProvider } from '@supabase-labs/y-supabase'
import {
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Awareness } from 'y-protocols/awareness'
import * as Y from 'yjs'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'

type UseRealtimeFlowOptions = {
  channel: string
  persistence?: boolean | SupabasePersistenceOptions
  awareness?: boolean | Awareness
  initialNodes?: Node[]
  initialEdges?: Edge[]
}

type SetStateAction<T> = T | ((prev: T) => T)

const INITIAL_SYNC_MS = 350

export function useRealtimeFlow({
  channel,
  persistence,
  awareness = true,
  initialNodes = [],
  initialEdges = [],
}: UseRealtimeFlowOptions) {
  const [nodes, setNodesState] = useState<Node[]>([])
  const [edges, setEdgesState] = useState<Edge[]>([])
  const [synced, setSynced] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<SupabaseProvider | null>(null)
  const syncedRef = useRef(false)
  const initialNodesRef = useRef(initialNodes)
  const initialEdgesRef = useRef(initialEdges)

  useEffect(() => {
    const doc = new Y.Doc()
    const yNodes = doc.getMap<string>('nodes')
    const yEdges = doc.getMap<string>('edges')
    const initialNodesForChannel = initialNodesRef.current
    const initialEdgesForChannel = initialEdgesRef.current
    let initialSyncTimer: ReturnType<typeof setTimeout> | null = null
    let hasRemoteActivity = false

    const supabase = createClient()
    const provider = new SupabaseProvider(channel, doc, supabase as any, {
      awareness,
      persistence,
    })

    // Sync Y.Map state to React state
    const syncNodesFromYjs = () => {
      const parsed: Node[] = []
      yNodes.forEach((value) => {
        try {
          parsed.push(JSON.parse(value))
        } catch {}
      })
      setNodesState(parsed)
    }

    const syncEdgesFromYjs = () => {
      const parsed: Edge[] = []
      yEdges.forEach((value) => {
        try {
          parsed.push(JSON.parse(value))
        } catch {}
      })
      setEdgesState(parsed)
    }

    const clearInitialSyncTimer = () => {
      if (initialSyncTimer) {
        clearTimeout(initialSyncTimer)
        initialSyncTimer = null
      }
    }

    const clearSyncError = () => {
      setSyncError(null)
    }

    const seedInitialState = () => {
      if (yNodes.size === 0 && initialNodesForChannel.length > 0) {
        doc.transact(() => {
          for (const node of initialNodesForChannel) {
            yNodes.set(node.id, JSON.stringify(node))
          }
        }, 'local')
      }

      if (yEdges.size === 0 && initialEdgesForChannel.length > 0) {
        doc.transact(() => {
          for (const edge of initialEdgesForChannel) {
            yEdges.set(edge.id, JSON.stringify(edge))
          }
        }, 'local')
      }
    }

    const nodesObserver = (event: Y.YMapEvent<string>) => {
      if (event.transaction.origin === 'local') return
      hasRemoteActivity = true
      syncNodesFromYjs()
    }

    const edgesObserver = (event: Y.YMapEvent<string>) => {
      if (event.transaction.origin === 'local') return
      hasRemoteActivity = true
      syncEdgesFromYjs()
    }

    yNodes.observe(nodesObserver)
    yEdges.observe(edgesObserver)

    const markSynced = (shouldSeed = false) => {
      if (syncedRef.current) return
      clearInitialSyncTimer()
      clearSyncError()
      syncedRef.current = true

      if (shouldSeed && !hasRemoteActivity) {
        seedInitialState()
      }

      // Sync React state from Yjs (includes seeded initial data if applied)
      syncNodesFromYjs()
      syncEdgesFromYjs()
      setSynced(true)
    }

    const markSyncError = (error: Error) => {
      clearInitialSyncTimer()
      if (syncedRef.current) return
      setSyncError(error.message || 'Failed to sync flow')
    }

    const persistenceInstance = provider.getPersistence()
    if (persistenceInstance) {
      // With persistence: wait for persisted state to load
      if (persistenceInstance.synced) {
        markSynced()
      } else {
        persistenceInstance.on('synced', () => {
          markSynced()
        })
        persistenceInstance.on('error', (error) => {
          markSyncError(error)
        })
      }
    } else {
      provider.on('connect', () => {
        clearSyncError()
        clearInitialSyncTimer()
        initialSyncTimer = setTimeout(() => {
          markSynced(true)
        }, INITIAL_SYNC_MS)
      })
      provider.on('message', () => {
        hasRemoteActivity = true
        markSynced()
      })
      provider.on('error', (error) => {
        markSyncError(error)
      })
    }

    docRef.current = doc
    providerRef.current = provider

    return () => {
      clearInitialSyncTimer()
      yNodes.unobserve(nodesObserver)
      yEdges.unobserve(edgesObserver)
      provider.destroy()
      doc.destroy()
      docRef.current = null
      providerRef.current = null
      syncedRef.current = false
      setSynced(false)
      setSyncError(null)
    }
  }, [channel, awareness, persistence])

  const syncNodesToYjs = useCallback((updated: Node[]) => {
    const doc = docRef.current
    if (!doc || !syncedRef.current) return

    const yNodes = doc.getMap<string>('nodes')
    doc.transact(() => {
      const newIds = new Set(updated.map((n) => n.id))
      for (const key of Array.from(yNodes.keys())) {
        if (!newIds.has(key)) yNodes.delete(key)
      }
      for (const node of updated) {
        yNodes.set(node.id, JSON.stringify(node))
      }
    }, 'local')
  }, [])

  const syncEdgesToYjs = useCallback((updated: Edge[]) => {
    const doc = docRef.current
    if (!doc || !syncedRef.current) return

    const yEdges = doc.getMap<string>('edges')
    doc.transact(() => {
      const newIds = new Set(updated.map((e) => e.id))
      for (const key of Array.from(yEdges.keys())) {
        if (!newIds.has(key)) yEdges.delete(key)
      }
      for (const edge of updated) {
        yEdges.set(edge.id, JSON.stringify(edge))
      }
    }, 'local')
  }, [])

  const setNodes = useCallback(
    (nodesOrUpdater: SetStateAction<Node[]>) => {
      setNodesState((current) => {
        const updated =
          typeof nodesOrUpdater === 'function' ? nodesOrUpdater(current) : nodesOrUpdater
        syncNodesToYjs(updated)
        return updated
      })
    },
    [syncNodesToYjs]
  )

  const setEdges = useCallback(
    (edgesOrUpdater: SetStateAction<Edge[]>) => {
      setEdgesState((current) => {
        const updated =
          typeof edgesOrUpdater === 'function' ? edgesOrUpdater(current) : edgesOrUpdater
        syncEdgesToYjs(updated)
        return updated
      })
    },
    [syncEdgesToYjs]
  )

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodesState((currentNodes) => {
      const updated = applyNodeChanges(changes, currentNodes)

      const doc = docRef.current
      if (!doc || !syncedRef.current) return updated

      const yNodes = doc.getMap<string>('nodes')

      doc.transact(() => {
        for (const change of changes) {
          if (change.type === 'remove') {
            yNodes.delete(change.id)
          } else if (change.type === 'add') {
            yNodes.set(change.item.id, JSON.stringify(change.item))
          } else {
            const node = updated.find((n) => n.id === change.id)
            if (node) {
              yNodes.set(node.id, JSON.stringify(node))
            }
          }
        }
      }, 'local')

      return updated
    })
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdgesState((currentEdges) => {
      const updated = applyEdgeChanges(changes, currentEdges)

      const doc = docRef.current
      if (!doc || !syncedRef.current) return updated

      const yEdges = doc.getMap<string>('edges')

      doc.transact(() => {
        for (const change of changes) {
          if (change.type === 'remove') {
            yEdges.delete(change.id)
          } else if (change.type === 'add') {
            yEdges.set(change.item.id, JSON.stringify(change.item))
          } else {
            const edge = updated.find((e) => e.id === change.id)
            if (edge) {
              yEdges.set(edge.id, JSON.stringify(edge))
            }
          }
        }
      }, 'local')

      return updated
    })
  }, [])

  const onConnect = useCallback((connection: Connection) => {
    setEdgesState((currentEdges) => {
      const updated = addEdge(connection, currentEdges)

      const doc = docRef.current
      if (!doc || !syncedRef.current) return updated

      const yEdges = doc.getMap<string>('edges')
      const newEdge = updated.find((e) => !currentEdges.some((ce) => ce.id === e.id))

      if (newEdge) {
        doc.transact(() => {
          yEdges.set(newEdge.id, JSON.stringify(newEdge))
        }, 'local')
      }

      return updated
    })
  }, [])

  return {
    nodes,
    edges,
    synced,
    syncError,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
  }
}
