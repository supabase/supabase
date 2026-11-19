export type Point = [number, number]

export interface PathNode {
  id: string
  point: Point
  in?: Point
  out?: Point
}

type Shape = PathNode[][]

// the symbol box and the full wordmark width, in the units of the logo SVG files. the symbol sits at the same place in both
export const SYMBOL_WIDTH = 109
export const SYMBOL_HEIGHT = 113
export const WORDMARK_WIDTH = 581

export const ROWS = [0, 40.06, 56.2, 72.29, SYMBOL_HEIGHT]
export const COLUMNS = [0, 54.2, SYMBOL_WIDTH]
export const SLANT = { dx: 43.15, dy: -54.35 }
export const SLANT_ORIGINS = [
  [2.17, 56.42],
  [106.86, 55.94],
] as const
// px added to every bezier handle on screen, so short corner handles stay visible and grabbable
const HANDLE_REACH = 24

// the outer edge of both symbol halves. the halves overlap on the middle spine, so one path avoids a double line
export const SYMBOL_OUTLINE =
  'M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.27 40.0627H99.1935C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L54.46 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z'

// the supabase lettering, from supabase-logo-green-black-transparent.svg
export const LETTER_PATHS = [
  'M151.397 66.7608C151.996 72.3621 157.091 81.9642 171.877 81.9642C184.764 81.9642 190.959 73.7624 190.959 65.7607C190.959 58.559 186.063 52.6577 176.373 50.6571L169.379 49.1569C166.682 48.6568 164.884 47.1565 164.884 44.7559C164.884 41.9552 167.681 39.8549 171.178 39.8549C176.772 39.8549 178.87 43.5556 179.27 46.4564L190.359 43.9558C189.76 38.6546 185.064 29.7527 171.078 29.7527C160.488 29.7527 152.696 37.0543 152.696 45.8561C152.696 52.7576 156.991 58.4591 166.482 60.5594L172.976 62.0598C176.772 62.8599 178.271 64.6605 178.271 66.8609C178.271 69.4615 176.173 71.762 171.777 71.762C165.983 71.762 163.085 68.1611 162.786 64.2602L151.397 66.7608Z',
  'M233.421 80.4639H246.109C245.909 78.7635 245.609 75.3628 245.609 71.5618V31.2529H232.321V59.8592C232.321 65.5606 228.925 69.5614 223.031 69.5614C216.837 69.5614 214.039 65.1604 214.039 59.6592V31.2529H200.752V62.3599C200.752 73.0622 207.545 81.7642 219.434 81.7642C224.628 81.7642 230.325 79.7638 233.022 75.1627C233.022 77.1631 233.221 79.4636 233.421 80.4639Z',
  'M273.076 99.4682V75.663C275.473 78.9636 280.469 81.6644 287.263 81.6644C301.149 81.6644 310.439 70.6617 310.439 55.7584C310.439 41.1553 302.148 30.1528 287.762 30.1528C280.37 30.1528 274.875 33.4534 272.677 37.2544V31.253H259.79V99.4682H273.076ZM297.352 55.8585C297.352 64.6606 291.958 69.7616 285.164 69.7616C278.372 69.7616 272.877 64.5605 272.877 55.8585C272.877 47.1566 278.372 42.0554 285.164 42.0554C291.958 42.0554 297.352 47.1566 297.352 55.8585Z',
  'M317.964 67.0609C317.964 74.7627 324.357 81.8643 334.848 81.8643C342.139 81.8643 346.835 78.4634 349.332 74.5625C349.332 76.463 349.532 79.1635 349.832 80.4639H362.02C361.72 78.7635 361.422 75.2627 361.422 72.6622V48.4567C361.422 38.5545 355.627 29.7527 340.043 29.7527C326.855 29.7527 319.761 38.2544 318.963 45.9562L330.751 48.4567C331.151 44.1558 334.348 40.455 340.141 40.455C345.737 40.455 348.434 43.3556 348.434 46.8564C348.434 48.5568 347.536 49.9572 344.738 50.3572L332.65 52.1576C324.458 53.3579 317.964 58.2589 317.964 67.0609ZM337.644 71.962C333.349 71.962 331.25 69.1614 331.25 66.2608C331.25 62.4599 333.947 60.5594 337.345 60.0594L348.434 58.359V60.5594C348.434 69.2615 343.239 71.962 337.644 71.962Z',
  'M387.703 80.4641V74.4627C390.299 78.6637 395.494 81.6644 402.288 81.6644C416.276 81.6644 425.467 70.5618 425.467 55.6585C425.467 41.0552 417.174 29.9528 402.788 29.9528C395.494 29.9528 390.1 33.1535 387.902 36.6541V8.04785H374.815V80.4641H387.703ZM412.178 55.7584C412.178 64.7605 406.784 69.7616 399.99 69.7616C393.297 69.7616 387.703 64.6606 387.703 55.7584C387.703 46.7564 393.297 41.8554 399.99 41.8554C406.784 41.8554 412.178 46.7564 412.178 55.7584Z',
  'M432.99 67.0609C432.99 74.7627 439.383 81.8643 449.873 81.8643C457.165 81.8643 461.862 78.4634 464.358 74.5625C464.358 76.463 464.559 79.1635 464.858 80.4639H477.046C476.748 78.7635 476.448 75.2627 476.448 72.6622V48.4567C476.448 38.5545 470.653 29.7527 455.068 29.7527C441.881 29.7527 434.788 38.2544 433.989 45.9562L445.776 48.4567C446.177 44.1558 449.374 40.455 455.167 40.455C460.763 40.455 463.46 43.3556 463.46 46.8564C463.46 48.5568 462.561 49.9572 459.763 50.3572L447.676 52.1576C439.484 53.3579 432.99 58.2589 432.99 67.0609ZM452.671 71.962C448.375 71.962 446.276 69.1614 446.276 66.2608C446.276 62.4599 448.973 60.5594 452.371 60.0594L463.46 58.359V60.5594C463.46 69.2615 458.265 71.962 452.671 71.962Z',
  'M485.645 66.7608C486.243 72.3621 491.339 81.9642 506.124 81.9642C519.012 81.9642 525.205 73.7624 525.205 65.7607C525.205 58.559 520.311 52.6577 510.62 50.6571L503.626 49.1569C500.929 48.6568 499.132 47.1565 499.132 44.7559C499.132 41.9552 501.928 39.8549 505.425 39.8549C511.021 39.8549 513.118 43.5556 513.519 46.4564L524.607 43.9558C524.007 38.6546 519.312 29.7527 505.326 29.7527C494.735 29.7527 486.944 37.0543 486.944 45.8561C486.944 52.7576 491.238 58.4591 500.73 60.5594L507.224 62.0598C511.021 62.8599 512.519 64.6605 512.519 66.8609C512.519 69.4615 510.421 71.762 506.025 71.762C500.23 71.762 497.334 68.1611 497.034 64.2602L485.645 66.7608Z',
  'M545.385 50.2571C545.685 45.7562 549.482 40.5549 556.375 40.5549C563.967 40.5549 567.165 45.3561 567.365 50.2571H545.385ZM568.664 63.0601C567.065 67.4609 563.668 70.5617 557.474 70.5617C550.88 70.5617 545.385 65.8606 545.087 59.3593H580.252C580.252 59.159 580.451 57.1587 580.451 55.2582C580.451 39.4547 571.361 29.7527 556.175 29.7527C543.588 29.7527 531.998 39.9548 531.998 55.6584C531.998 72.262 543.886 81.9642 557.374 81.9642C569.462 81.9642 577.255 74.8626 579.753 66.3607L568.664 63.0601Z',
]

// reads paths that use only absolute M, L, H, V, C and Z commands
const toShape = (path: string): Shape => {
  const tokens = path.match(/[MLHVCZ]|-?(?:\d+\.?\d*|\.\d+)/g) ?? []
  const read = (index: number) => Number(tokens[index])
  const subpaths: Shape = []
  let nodes: PathNode[] = []
  let index = 0
  let command = ''
  let x = 0
  let y = 0

  while (index < tokens.length) {
    if (/[MLHVCZ]/.test(tokens[index])) command = tokens[index++]
    if (command === 'Z') {
      subpaths.push(toClosedSubpath(nodes))
      nodes = []
      continue
    }
    if (command === 'C') {
      nodes[nodes.length - 1].out = [read(index), read(index + 1)]
      x = read(index + 4)
      y = read(index + 5)
      nodes.push({ id: `${x}:${y}`, point: [x, y], in: [read(index + 2), read(index + 3)] })
      index += 6
      continue
    }
    if (command === 'M' || command === 'L') {
      x = read(index)
      y = read(index + 1)
      index += 2
    } else if (command === 'H') {
      x = read(index++)
    } else if (command === 'V') {
      y = read(index++)
    }
    nodes.push({ id: `${x}:${y}`, point: [x, y] })
  }

  return subpaths
}

// a subpath that ends on its start point closes with that last segment, so the end node merges into the start node
const toClosedSubpath = (nodes: PathNode[]): PathNode[] => {
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const isOnStart =
    Math.hypot(first.point[0] - last.point[0], first.point[1] - last.point[1]) < 0.01
  if (nodes.length < 2 || !isOnStart) return nodes
  return [{ ...first, in: last.in }, ...nodes.slice(1, -1)]
}

const toCoords = ([x, y]: Point) => `${x} ${y}`

export const toPathData = (shape: Shape) =>
  shape
    .map((nodes) => {
      const segments = nodes.map((from, index) => {
        const to = nodes[(index + 1) % nodes.length]
        return from.out || to.in
          ? `C${toCoords(from.out ?? from.point)} ${toCoords(to.in ?? to.point)} ${toCoords(to.point)}`
          : `L${toCoords(to.point)}`
      })
      return `M${toCoords(nodes[0].point)}${segments.join('')}Z`
    })
    .join('')

export const offsetPoint = ({ point, dx, dy }: { point?: Point; dx: number; dy: number }) =>
  point ? ([point[0] + dx, point[1] + dy] satisfies Point) : undefined

export const toHandleView = ({
  anchor,
  handle,
  scale,
}: {
  anchor: Point
  handle: Point
  scale: number
}): Point => {
  const length = Math.hypot(handle[0] - anchor[0], handle[1] - anchor[1]) * scale
  if (!length) return handle
  const stretch = (length + HANDLE_REACH) / length
  return [
    anchor[0] + (handle[0] - anchor[0]) * stretch,
    anchor[1] + (handle[1] - anchor[1]) * stretch,
  ]
}

// the inverse of toHandleView, so a dragged handle stays under the pointer
export const fromHandleView = ({
  anchor,
  view,
  scale,
}: {
  anchor: Point
  view: Point
  scale: number
}): Point => {
  const length = Math.hypot(view[0] - anchor[0], view[1] - anchor[1]) * scale
  if (!length) return anchor
  const shrink = Math.max(length - HANDLE_REACH, 0) / length
  return [anchor[0] + (view[0] - anchor[0]) * shrink, anchor[1] + (view[1] - anchor[1]) * shrink]
}

export const INITIAL_SHAPES = [SYMBOL_OUTLINE, ...LETTER_PATHS].map(toShape)

const LETTER_BOUNDS = INITIAL_SHAPES.slice(1).map((shape) => {
  const points = shape.flat().map((node) => node.point)
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  }
})
// the s sits on the baseline and reaches the x-height. the b sets the ascender and the p the descender
export const WORDMARK_ROWS = [
  Math.min(...LETTER_BOUNDS.map(({ top }) => top)),
  LETTER_BOUNDS[0].top,
  LETTER_BOUNDS[0].bottom,
  Math.max(...LETTER_BOUNDS.map(({ bottom }) => bottom)),
]
export const WORDMARK_COLUMNS = LETTER_BOUNDS.flatMap(({ left, right }) => [left, right])
