// One lap of the hero's ring is a round of work on the project, split evenly into nine events. Each
// one has a long prong on the ring, and the cube shows it as the pulse gets there:
//
//   0, 1, 2   Build     the project grows, and new components are traced in and linked to it
//   3, 4, 5   Deploy    it lifts as a preview, the check passes, and it settles with the logo lit
//   6, 7, 8   Operate   it's monitored, an issue turns a component red, and a fix traces back over it
//
// The project starts small, with one component, and grows over its first laps. Once it's fully grown
// a lap only reworks one component: that's the "back again".

export const LAP_MS = 21_000
export const EVENTS_PER_LAP = 9
/** Matches the ring's draw-in, so the first lap starts as the ring finishes drawing. */
export const LIFECYCLE_STARTS_AT_MS = 2_200

export const LIFECYCLE_STAGES = ['Build', 'Deploy', 'Operate']

/** Where a cube stands on the ground, measured from the middle of the project, which has a size of 1. */
export type CubeSpot = { x: number; y: number; size: number }

/** In the order they're added to the project. */
export const COMPONENT_SPOTS: CubeSpot[] = [
  { x: 1.6, y: 0, size: 0.5 },
  { x: 0, y: 1.6, size: 0.42 },
  { x: 0, y: -1.6, size: 0.4 },
  { x: -1.6, y: 0, size: 0.46 },
  { x: 1.35, y: -1.35, size: 0.36 },
  { x: -1.35, y: 1.35, size: 0.38 },
]

export type CubePiece = {
  /** How much of this piece is traced in, from 0 to 1. */
  built: number
  /** Whether this piece is showing an issue. */
  isBroken: boolean
  /** How much of a broken piece the fix has traced back over, from 0 to 1. */
  repaired: number
  /** How strongly the piece glows in the accent color, from 0 to 1. */
  glow: number
}

export type CubeComponent = CubePiece & {
  /** How much of the line from the project is traced in, from 0 to 1. */
  link: number
}

export type CubeState = {
  /** How big the project and its components are, from 0 to 1. */
  scale: number
  /** How far the project has risen off its resting place, from 0 to 1. */
  lift: number
  /** The project cube's three sides. */
  pieces: CubePiece[]
  /** One for each of the component spots. */
  components: CubeComponent[]
  /** How much of the logo is lit from the bottom up, from 0 to 1. */
  logo: number
  /** Where the monitoring scan is from the top down, from 0 to 1, or null when it isn't running. */
  scan: number | null
}

/** Time for the hero, shared so the ring and cube stay in step when the ring is dragged. */
export type LifecycleClock = {
  /** How far through the life cycle it is, in ms. */
  read: () => number
  /** Stops time, for as long as the ring is held. */
  hold: () => void
  /** Moves held time forward or back, though never to before the start. */
  scrub: (ms: number) => void
  release: () => void
}

export function createLifecycleClock(): LifecycleClock {
  let lived = -LIFECYCLE_STARTS_AT_MS
  let runningSince: number | null = performance.now()
  const read = () => lived + (runningSince === null ? 0 : performance.now() - runningSince)

  return {
    read: () => Math.max(read(), 0),
    hold: () => {
      lived = Math.max(read(), 0)
      runningSince = null
    },
    scrub: (ms) => {
      lived = Math.max(lived + ms, 0)
    },
    release: () => {
      runningSince = performance.now()
    },
  }
}

const PIECES = 3
const PIECE_EVENTS = 0.5
const BUILD_EVENTS = 3
const GROW_EVENTS = 1
const SCAN_EVENTS = 1
// How much of the time a new component gets goes on the line that leads to it
const LINK_SHARE = 0.4

// What each of the first laps ends up with
const GROWTH = [
  { scale: 0.5, components: 1 },
  { scale: 0.75, components: 3 },
  { scale: 1, components: COMPONENT_SPOTS.length },
]

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const between = (at: number, from: number, to: number) =>
  easeInOutCubic(Math.min(Math.max((at - from) / (to - from), 0), 1))

const FINISHED_PIECE: CubePiece = { built: 1, isBroken: false, repaired: 0, glow: 0 }

/** The finished project, for anyone who has asked for less motion. */
export const RESTING_CUBE: CubeState = {
  scale: 1,
  lift: 0,
  pieces: Array.from({ length: PIECES }, () => FINISHED_PIECE),
  components: COMPONENT_SPOTS.map(() => ({ ...FINISHED_PIECE, link: 1 })),
  logo: 1,
  scan: null,
}

export function getCubeState(lap: number, lapIndex: number): CubeState {
  const at = lap * EVENTS_PER_LAP
  const isFirstLap = lapIndex === 0
  const isFullyGrown = lapIndex >= GROWTH.length
  const growth = GROWTH[Math.min(lapIndex, GROWTH.length - 1)]
  const previous = GROWTH[Math.min(lapIndex - 1, GROWTH.length - 1)]

  const scale =
    previous && !isFullyGrown
      ? previous.scale + (growth.scale - previous.scale) * between(at, 0, GROW_EVENTS)
      : growth.scale

  // New components are traced in once the project is done being traced in or growing
  const existing = previous?.components ?? 0
  const newFrom = isFirstLap ? PIECES * PIECE_EVENTS : GROW_EVENTS
  const newEvents = (BUILD_EVENTS - newFrom) / Math.max(growth.components - existing, 1)

  const checkGlow = at >= 4 ? 1 - between(at, 4, 4.75) : 0
  const isIssueOpen = at >= 7 && at < 8.5
  const fixGlow = at >= 8.5 ? 1 - between(at, 8.5, 9) : 0
  const isScanning = (at >= 6 && at < 7) || at >= 8.5
  const brokenComponent = (lapIndex * 2) % growth.components
  const reworkedComponent = lapIndex % growth.components

  const getLinkAndBuilt = (index: number) => {
    if (index >= growth.components) return { link: 0, built: 0 }
    if (index >= existing) {
      const startsAt = newFrom + (index - existing) * newEvents
      const linkedAt = startsAt + newEvents * LINK_SHARE
      return {
        link: between(at, startsAt, linkedAt),
        built: between(at, linkedAt, startsAt + newEvents),
      }
    }
    if (!isFullyGrown || index !== reworkedComponent) return { link: 1, built: 1 }
    // Comes off during the first event, and goes back on during the second
    return { link: 1, built: at < 1 ? 1 - between(at, 0, 0.5) : between(at, 1, 2) }
  }

  return {
    scale,
    lift: between(at, 3, 4) * (1 - between(at, 5, 5.5)),
    pieces: Array.from({ length: PIECES }, (_, piece) => ({
      built: isFirstLap ? between(at, piece * PIECE_EVENTS, (piece + 1) * PIECE_EVENTS) : 1,
      isBroken: false,
      repaired: 0,
      glow: checkGlow,
    })),
    components: COMPONENT_SPOTS.map((_, index) => ({
      ...getLinkAndBuilt(index),
      isBroken: index === brokenComponent && isIssueOpen,
      repaired: between(at, 8, 8.5),
      glow: Math.max(checkGlow, index === brokenComponent ? fixGlow : 0),
    })),
    logo: isFirstLap ? between(at, 5, 5.5) : 1,
    scan: isScanning ? ((at - 6) / SCAN_EVENTS) % 1 : null,
  }
}
