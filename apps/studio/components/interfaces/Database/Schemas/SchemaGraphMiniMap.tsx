import { getNodesBounds, MiniMap, Panel, useStore, type Rect } from '@xyflow/react'

const MINIMAP_MAX_WIDTH = 200
const MINIMAP_MAX_HEIGHT = 150
const VIEWPORT_RADIUS = 8

export const SchemaGraphMiniMap = () => {
  const canvasAspect = useStore((s) =>
    s.width > 0 && s.height > 0 ? s.height / s.width : MINIMAP_MAX_HEIGHT / MINIMAP_MAX_WIDTH
  )
  const width = Math.round(Math.min(MINIMAP_MAX_WIDTH, MINIMAP_MAX_HEIGHT / canvasAspect))
  const height = Math.round(width * canvasAspect)

  // react flow cuts a square hole in its mask. this repeats its minimap math for a rounded hole
  const viewport = useStore(
    (s): Rect => {
      const [tx, ty, zoom] = s.transform
      const view = { x: -tx / zoom, y: -ty / zoom, width: s.width / zoom, height: s.height / zoom }
      const nodes = Array.from(s.nodeLookup.values()).filter((node) => !node.hidden)
      const nodesBounds =
        nodes.length > 0 ? getNodesBounds(nodes, { nodeLookup: s.nodeLookup }) : view
      const x = Math.min(view.x, nodesBounds.x)
      const y = Math.min(view.y, nodesBounds.y)
      const boundsWidth = Math.max(view.x + view.width, nodesBounds.x + nodesBounds.width) - x
      const boundsHeight = Math.max(view.y + view.height, nodesBounds.y + nodesBounds.height) - y
      const scale = Math.max(boundsWidth / width, boundsHeight / height)
      // the canvas has no size before the first measure
      if (!(scale > 0)) return { x: 0, y: 0, width, height }
      return {
        x: (view.x - x) / scale + (width - boundsWidth / scale) / 2,
        y: (view.y - y) / scale + (height - boundsHeight / scale) / 2,
        width: view.width / scale,
        height: view.height / scale,
      }
    },
    (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  )
  const { x, y, width: w, height: h } = viewport
  // a large schema gives a small viewport, so the radius shrinks with it
  const r = Math.min(VIEWPORT_RADIUS, w / 2, h / 2)
  const maskPath = [
    `M0 0H${width}V${height}H0Z`,
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`,
  ].join('')

  return (
    <>
      <MiniMap
        pannable
        zoomable
        position="bottom-right"
        bgColor="var(--card)"
        nodeColor="var(--input)"
        maskColor="transparent"
        offsetScale={0}
        style={{ width, height }}
        className="rounded-md overflow-hidden mr-2.75! mb-11!"
      />
      <Panel
        position="bottom-right"
        style={{ width, height }}
        className="floating-surface-shadow-xs pointer-events-none rounded-md overflow-hidden mr-2.75! mb-11!"
      >
        <svg aria-hidden width={width} height={height}>
          <path d={maskPath} fillRule="evenodd" className="fill-foreground/5" />
          <rect
            x={x + 0.25}
            y={y + 0.25}
            width={w - 0.5}
            height={h - 0.5}
            rx={r - 0.25}
            fill="none"
            strokeWidth={0.5}
            className="stroke-border"
          />
        </svg>
      </Panel>
    </>
  )
}
