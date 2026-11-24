declare module '*.css' {
  export const styles: Record<string, string>
  export default styles
}

declare module '*.svg' {
  const content: any
  export default content
}

declare module '*.png' {
  const content: {
    src: string
    height: number
    width: number
    blurDataURL?: string
    blurWidth?: number
    blurHeight?: number
  }
  export default content
}
