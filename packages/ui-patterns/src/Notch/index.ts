export const getNotchOutline = (width: number): string =>
  `M0 39.5A7.5 7.5 0 0 0 7.5 32V16A8.5 8.5 0 0 1 16 7.5H${width}A7.5 7.5 0 0 0 ${width + 7.5} 0`

export const getNotchFocusRing = (width: number): string =>
  `M0 41A9 9 0 0 0 9 32V16A7 7 0 0 1 16 9H${width}A9 9 0 0 0 ${width + 9} 0`

export const getNotchMask = (width: number): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width + 10}' height='42'><path d='M0 40A8 8 0 0 0 8 32V16A8 8 0 0 1 16 8H${width}A8 8 0 0 0 ${width + 8} 0H${width + 10}V42H0Z'/></svg>`
  )}")`
