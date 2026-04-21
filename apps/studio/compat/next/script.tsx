import type { ComponentPropsWithoutRef } from 'react'

type ScriptProps = ComponentPropsWithoutRef<'script'> & {
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' | 'worker'
}

export default function Script({ strategy: _strategy, ...props }: ScriptProps) {
  return <script {...props} />
}
