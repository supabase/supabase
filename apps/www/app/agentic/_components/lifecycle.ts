// One lap of the hero's ring is the project's life cycle, split evenly into nine events. Each one has
// a long prong on the ring, and the cube shows it as the pulse gets there:
//
//   0, 1, 2   Build     the cube's three sides are traced in
//   3, 4, 5   Deploy    it lifts as a preview, the check passes, and it settles with the logo lit
//   6, 7, 8   Operate   it's monitored, an issue turns a side red, and a fix traces back over it
//
// The first lap builds the cube from an outline. After that the project is already live, so a lap
// only reworks one side: that's the "back again".

export const LAP_MS = 27_000
export const EVENTS_PER_LAP = 9
/** Matches the ring's draw-in, so the first lap starts as the ring finishes drawing. */
export const LIFECYCLE_STARTS_AT_MS = 2_200

export const LIFECYCLE_STAGES = ['Build', 'Deploy', 'Operate']

export type CubePiece = {
  /** How much of this side is traced in, from 0 to 1. */
  built: number
  /** Whether this side is showing an issue. */
  isBroken: boolean
  /** How much of a broken side the fix has traced back over, from 0 to 1. */
  repaired: number
  /** How strongly the side glows in the accent color, from 0 to 1. */
  glow: number
}

export type CubeState = {
  /** How far the cube has risen off its resting place, from 0 to 1. */
  lift: number
  pieces: CubePiece[]
  /** How much of the logo is lit from the bottom up, from 0 to 1. */
  logo: number
  /** Where the monitoring scan is from the top down, from 0 to 1, or null when it isn't running. */
  scan: number | null
}

const PIECES = 3
const BROKEN_PIECE = 1
const SCAN_EVENTS = 1

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const between = (at: number, from: number, to: number) =>
  easeInOutCubic(Math.min(Math.max((at - from) / (to - from), 0), 1))

/** The finished cube, for anyone who has asked for less motion. */
export const RESTING_CUBE: CubeState = {
  lift: 0,
  pieces: Array.from({ length: PIECES }, () => ({
    built: 1,
    isBroken: false,
    repaired: 0,
    glow: 0,
  })),
  logo: 1,
  scan: null,
}

export function getCubeState(lap: number, lapIndex: number): CubeState {
  const at = lap * EVENTS_PER_LAP
  const isFirstLap = lapIndex === 0
  const reworkedPiece = lapIndex % PIECES

  const getBuilt = (piece: number) => {
    if (isFirstLap) return between(at, piece, piece + 1)
    if (piece !== reworkedPiece) return 1
    // Comes off during the first event, and goes back on during the second
    return at < 1 ? 1 - between(at, 0, 0.5) : between(at, 1, 2)
  }

  const checkGlow = at >= 4 ? 1 - between(at, 4, 4.75) : 0
  const isBroken = at >= 7 && at < 8.5
  const fixGlow = at >= 8.5 ? 1 - between(at, 8.5, 9) : 0
  const isScanning = (at >= 6 && at < 7) || at >= 8.5

  return {
    lift: between(at, 3, 4) * (1 - between(at, 5, 5.5)),
    pieces: Array.from({ length: PIECES }, (_, piece) => ({
      built: getBuilt(piece),
      isBroken: piece === BROKEN_PIECE && isBroken,
      repaired: between(at, 8, 8.5),
      glow: Math.max(checkGlow, piece === BROKEN_PIECE ? fixGlow : 0),
    })),
    logo: isFirstLap ? between(at, 5, 5.5) : 1,
    scan: isScanning ? ((at - 6) / SCAN_EVENTS) % 1 : null,
  }
}
