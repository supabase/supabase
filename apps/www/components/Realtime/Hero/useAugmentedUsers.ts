'use client'

import { useEffect, useRef } from 'react'

import { AUGMENTED_USERS, type AugmentedUser } from './augmentedUsers.constants'
import { getLocalPointInContainer, randomPointInContainer } from './heroCoordinates'
import type { UserRow } from './mockUserTableData'

type Point = { x: number; y: number }
type BotPhase = 'offline' | 'idle' | 'moving' | 'focusing'

const MOVE_MS = 2000
const ARC_LIFT = 56
const DISCONNECT_CHANCE = 0.22
const MIN_IDLE_MS = 900
const MAX_IDLE_MS = 5200
const MIN_FOCUS_MS = 1100
const MAX_FOCUS_MS = 3200
const MIN_OFFLINE_MS = 2500
const MAX_OFFLINE_MS = 11000

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const quadBezier = (t: number, p0: Point, p1: Point, p2: Point): Point => {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

type CellTarget = {
  rowId: string
  columnKey: keyof UserRow
  x: number
  y: number
}

type BotState = {
  user: AugmentedUser
  position: Point
  phase: BotPhase
  phaseStarted: number
  moveFrom: Point
  moveTo: Point
  arcControl: Point
  target: CellTarget | null
  idleDelayMs: number
  focusDurationMs: number
  offlineUntil: number
}

const pickCellTarget = (container: HTMLElement): CellTarget | null => {
  const cells = container.querySelectorAll<HTMLElement>('[data-cell]')
  if (cells.length === 0) return null

  const cell = cells[Math.floor(Math.random() * cells.length)]!
  const dataCell = cell.dataset.cell
  if (!dataCell) return null

  const [rowId, columnKey] = dataCell.split(':') as [string, keyof UserRow]
  if (!rowId || !columnKey) return null

  const { x, y } = getLocalPointInContainer(container, cell, 0.35, 0.55)

  return {
    rowId,
    columnKey,
    x,
    y,
  }
}

const createInitialBots = (container: HTMLElement | null): BotState[] =>
  AUGMENTED_USERS.map((user, index) => {
    const position = container ? randomPointInContainer(container, index) : { x: 120 + index * 20, y: 120 }
    const startsOffline = Math.random() < 0.35
    const now = performance.now()

    return {
      user,
      position,
      phase: startsOffline ? 'offline' : 'idle',
      phaseStarted: now,
      moveFrom: position,
      moveTo: position,
      arcControl: { x: position.x, y: position.y - 40 },
      target: null,
      idleDelayMs: randomBetween(MIN_IDLE_MS, MAX_IDLE_MS),
      focusDurationMs: randomBetween(MIN_FOCUS_MS, MAX_FOCUS_MS),
      offlineUntil: startsOffline ? now + randomBetween(MIN_OFFLINE_MS, MAX_OFFLINE_MS) : 0,
    }
  })

type UseAugmentedUsersOptions = {
  containerRef: React.RefObject<HTMLElement | null>
  onCursorMove: (userId: string, name: string, color: string, x: number, y: number) => void
  onCellFocus: (
    userId: string,
    name: string,
    color: string,
    rowId: string,
    columnKey: keyof UserRow,
    isFocused: boolean
  ) => void
  onUserDisconnect: (userId: string) => void
  onActiveUsersChange: (count: number) => void
}

export function useAugmentedUsers({
  containerRef,
  onCursorMove,
  onCellFocus,
  onUserDisconnect,
  onActiveUsersChange,
}: UseAugmentedUsersOptions) {
  const botsRef = useRef<BotState[]>([])
  const initializedRef = useRef(false)
  const callbacksRef = useRef({
    onCursorMove,
    onCellFocus,
    onUserDisconnect,
    onActiveUsersChange,
  })
  callbacksRef.current = {
    onCursorMove,
    onCellFocus,
    onUserDisconnect,
    onActiveUsersChange,
  }

  const syncActiveCount = () => {
    const count = botsRef.current.filter((bot) => bot.phase !== 'offline').length
    callbacksRef.current.onActiveUsersChange(count)
  }

  useEffect(() => {
    let raf = 0
    let isVisible = !document.hidden

    const onVisibilityChange = () => {
      isVisible = !document.hidden
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    const clearFocus = (bot: BotState) => {
      const target = bot.target
      if (!target) return

      callbacksRef.current.onCellFocus(
        bot.user.id,
        bot.user.name,
        bot.user.color,
        target.rowId,
        target.columnKey,
        false
      )
      bot.target = null
    }

    const disconnect = (bot: BotState, now: number) => {
      clearFocus(bot)
      callbacksRef.current.onUserDisconnect(bot.user.id)
      bot.phase = 'offline'
      bot.phaseStarted = now
      bot.offlineUntil = now + randomBetween(MIN_OFFLINE_MS, MAX_OFFLINE_MS)
      syncActiveCount()
    }

    const reconnect = (bot: BotState, now: number, index: number, containerEl: HTMLElement) => {
      bot.position = randomPointInContainer(containerEl, index)
      bot.moveFrom = bot.position
      bot.moveTo = bot.position
      bot.target = null
      bot.phase = 'idle'
      bot.phaseStarted = now
      bot.idleDelayMs = randomBetween(MIN_IDLE_MS, MAX_IDLE_MS)
      syncActiveCount()
    }

    const beginMove = (bot: BotState, target: CellTarget) => {
      bot.target = target
      bot.moveFrom = { ...bot.position }
      bot.moveTo = { x: target.x, y: target.y }

      const midX = (bot.moveFrom.x + bot.moveTo.x) / 2
      const midY = (bot.moveFrom.y + bot.moveTo.y) / 2
      const dx = bot.moveTo.x - bot.moveFrom.x
      const dy = bot.moveTo.y - bot.moveFrom.y
      const dist = Math.hypot(dx, dy) || 1
      const lift = Math.min(ARC_LIFT, dist * 0.35)

      bot.arcControl = {
        x: midX + (-dy / dist) * lift * 0.25,
        y: midY - lift,
      }

      bot.phase = 'moving'
      bot.phaseStarted = performance.now()
    }

    const beginFocus = (bot: BotState) => {
      const target = bot.target
      if (!target) {
        bot.phase = 'idle'
        bot.phaseStarted = performance.now()
        bot.idleDelayMs = randomBetween(MIN_IDLE_MS, MAX_IDLE_MS)
        return
      }

      bot.focusDurationMs = randomBetween(MIN_FOCUS_MS, MAX_FOCUS_MS)
      callbacksRef.current.onCellFocus(
        bot.user.id,
        bot.user.name,
        bot.user.color,
        target.rowId,
        target.columnKey,
        true
      )
      bot.phase = 'focusing'
      bot.phaseStarted = performance.now()
    }

    const endFocus = (bot: BotState, now: number) => {
      clearFocus(bot)
      bot.phase = 'idle'
      bot.phaseStarted = now
      bot.idleDelayMs = randomBetween(MIN_IDLE_MS, MAX_IDLE_MS)

      if (Math.random() < DISCONNECT_CHANCE) {
        disconnect(bot, now)
      }
    }

    const tick = (now: number) => {
      if (!isVisible) {
        raf = requestAnimationFrame(tick)
        return
      }

      const container = containerRef.current
      if (!container) {
        raf = requestAnimationFrame(tick)
        return
      }

      if (!initializedRef.current) {
        botsRef.current = createInitialBots(container)
        initializedRef.current = true
        syncActiveCount()
      }

      botsRef.current.forEach((bot, index) => {
        const elapsed = now - bot.phaseStarted

        if (bot.phase === 'offline') {
          if (now >= bot.offlineUntil) {
            reconnect(bot, now, index, container)
          }
          return
        }

        if (bot.phase === 'idle') {
          if (elapsed >= bot.idleDelayMs) {
            if (Math.random() < DISCONNECT_CHANCE * 0.35) {
              disconnect(bot, now)
              return
            }

            const target = pickCellTarget(container)
            if (target) beginMove(bot, target)
            else {
              bot.phaseStarted = now
              bot.idleDelayMs = randomBetween(400, 1200)
            }
          }
        } else if (bot.phase === 'moving') {
          const t = easeInOutCubic(Math.min(elapsed / MOVE_MS, 1))
          bot.position = quadBezier(t, bot.moveFrom, bot.arcControl, bot.moveTo)

          if (elapsed >= MOVE_MS) {
            bot.position = { ...bot.moveTo }
            beginFocus(bot)
          }
        } else if (bot.phase === 'focusing') {
          if (elapsed >= bot.focusDurationMs) {
            endFocus(bot, now)
          }
        }

        const { x, y } = bot.position
        callbacksRef.current.onCursorMove(bot.user.id, bot.user.name, bot.user.color, x, y)
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [containerRef])
}
