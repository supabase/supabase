// Reference: advisor-game-example/src/hooks/useStore.js
import { create } from 'zustand'
interface Cube {
  cubeKey: string
  pos: [number, number, number]
  texture: string
  createdBy?: string | null
  projectRef?: string
}

interface ActionHandlers {
  placeCube?: (position: [number, number, number]) => Promise<void>
  removeCube?: (position: [number, number, number]) => Promise<void>
}

interface GameStore {
  resources: number
  cubesByProject: Record<string, Cube[]>
  allCubes: Cube[]
  setResources: (value: number) => void
  adjustResources: (delta: number) => void
  setCubes: (cubes: Cube[], projectRef: string) => void
  setAllCubes: (cubes: Cube[]) => void
  getCubes: (projectRef: string) => Cube[]
  setCurrentUserId: (userId: string | null) => void
  setActionHandlers: (handlers: ActionHandlers | null) => void
  getRemainingResources: () => number
  resetWorld: (projectRef?: string) => void
  placeCube?: (position: [number, number, number]) => Promise<void>
  removeCube?: (position: [number, number, number]) => Promise<void>
  currentUserId?: string | null
  currentProjectRef?: string | null
  setCurrentProjectRef: (projectRef: string | null) => void
  lastCameraInteractionTime: number | null
  markCameraInteraction: () => void
  shouldBlockPlacement: () => boolean
}

export const useAdvisorGameStore = create<GameStore>((set, get) => ({
  resources: 10,
  cubesByProject: {},
  allCubes: [],
  setResources: (value) => {
    set(() => ({
      resources: value,
    }))
  },
  adjustResources: (delta) => {
    set((state) => {
      const next = Math.max(state.resources + delta, 0)
      return { resources: next }
    })
  },
  setCubes: (cubes, projectRef) => {
    set((state) => ({
      cubesByProject: {
        ...state.cubesByProject,
        [projectRef]: cubes,
      },
    }))
  },
  setAllCubes: (cubes) => {
    set(() => ({ allCubes: cubes }))
  },
  getCubes: (projectRef) => {
    const state = get()
    return state.cubesByProject[projectRef] || []
  },
  setCurrentUserId: (userId) => {
    set(() => ({ currentUserId: userId }))
  },
  setCurrentProjectRef: (projectRef) => {
    set(() => ({ currentProjectRef: projectRef }))
  },
  setActionHandlers: (handlers) => {
    set(() => ({
      placeCube: handlers?.placeCube,
      removeCube: handlers?.removeCube,
    }))
  },
  getRemainingResources: () => {
    const state = get()
    return state.resources
  },
  resetWorld: (projectRef) => {
    if (projectRef) {
      set((state) => ({
        cubesByProject: {
          ...state.cubesByProject,
          [projectRef]: [],
        },
      }))
    } else {
      set(() => ({
        cubesByProject: {},
        allCubes: [],
      }))
    }
  },
  lastCameraInteractionTime: null,
  markCameraInteraction: () => {
    set(() => ({
      lastCameraInteractionTime: Date.now(),
    }))
  },
  shouldBlockPlacement: () => {
    const { lastCameraInteractionTime } = get()
    if (lastCameraInteractionTime === null) {
      return false
    }
    return Date.now() - lastCameraInteractionTime < 200
  },
}))
