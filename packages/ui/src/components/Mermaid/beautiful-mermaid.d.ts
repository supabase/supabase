declare module 'beautiful-mermaid' {
  export interface RenderOptions {
    /** Theme preset name or 'mono' for mono mode */
    theme?: 'mono' | 'default' | 'dark' | 'forest' | 'neutral' | string
    /** Custom colors for mono mode */
    colors?: {
      background?: string
      foreground?: string
      primary?: string
      secondary?: string
    }
    /** Font configuration */
    font?: {
      family?: string
      size?: number
    }
    /** Output format */
    format?: 'svg' | 'ascii'
  }

  export interface RenderResult {
    /** Rendered SVG string */
    svg: string
    /** Rendered ASCII string (if format is 'ascii') */
    ascii?: string
    /** Diagram width */
    width: number
    /** Diagram height */
    height: number
  }

  /**
   * Render a Mermaid diagram to SVG or ASCII
   */
  export function render(diagram: string, options?: RenderOptions): Promise<RenderResult>

  /**
   * Render a Mermaid diagram synchronously (if supported)
   */
  export function renderSync(diagram: string, options?: RenderOptions): RenderResult
}
