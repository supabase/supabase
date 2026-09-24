// Normalize the border curve at contrast 0.5: (0.05 + 0.95 * 0.5)² = 0.275625.
export const controlSurfaceShadows = `
  [--button-shadow-opacity:0.04] dark:[--button-shadow-opacity:0.2]
  [--button-edge-strength:calc(var(--contrast-border,0.275625)/0.275625*0.6)]
  dark:[--button-edge-strength:calc(var(--contrast-border,0.275625)/0.275625)]
  [--button-edge-color:var(--colors-black)] dark:[--button-edge-color:var(--colors-white)]
  [--button-shadow-drop:0_1px_3px_0_hsl(var(--colors-black)/var(--button-shadow-opacity))]
  [--button-shadow-raised:var(--button-shadow-drop),inset_0_1px_0_0_hsl(var(--button-edge-color)/calc(0.04*var(--button-edge-strength))),inset_0_0_0_1px_hsl(var(--button-edge-color)/calc(0.06*var(--button-edge-strength))),inset_0_0_0_1px_hsl(var(--button-edge-color)/calc(0.1*var(--button-edge-strength)))]
  [--button-shadow-default:var(--button-shadow-drop),inset_0_1px_0_0_hsl(var(--button-edge-color)/calc(0.04*var(--button-edge-strength))),inset_0_0_0_1px_hsl(var(--colors-black)/calc(0.06*var(--button-edge-strength))),inset_0_-1px_0_0_hsl(var(--colors-black)/calc(0.06*var(--button-edge-strength))),inset_0_0_0_1px_hsl(var(--button-edge-color)/calc(0.1*var(--button-edge-strength)))]
`

export const raisedControlSurface = `
  text-foreground border-0 bg-card hover:bg-muted dark:bg-muted dark:hover:bg-accent
  dark:bg-[linear-gradient(to_bottom,hsl(var(--colors-white)/0.015),hsl(var(--colors-black)/0.01))]
  shadow-[var(--button-shadow-default)]
  data-[state=open]:bg-muted dark:data-[state=open]:bg-accent
`
