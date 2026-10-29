import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

// Client-only port of next/script (next/dist/client/script.js) for the
// TanStack build. React never executes <script> elements it renders on the
// client, so, like Next, we inject the script imperatively in an effect and
// render nothing. Scripts are deduped by `id` (or `src`) at module level, so
// remounts and duplicate instances don't execute the same script twice.

type Strategy = 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' | 'worker'

interface ScriptProps extends Omit<
  ComponentPropsWithoutRef<'script'>,
  'children' | 'onLoad' | 'onError'
> {
  strategy?: Strategy
  // Inline body, as an alternative to dangerouslySetInnerHTML.
  children?: ReactNode
  onLoad?: (e: Event) => void
  onReady?: () => void
  onError?: (e: Event | string) => void
}

// src -> promise settled when that remote script loads.
const ScriptCache = new Map<string, Promise<void>>()
// Keys (id || src) of scripts that have finished loading.
const LoadCache = new Set<string>()

const DOMAttributeNames: Record<string, string> = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
  noModule: 'noModule',
}

const ignoreProps = [
  'onLoad',
  'onReady',
  'dangerouslySetInnerHTML',
  'children',
  'onError',
  'strategy',
  'stylesheets',
]

const isBooleanScriptAttribute = (attr: string) => ['async', 'defer', 'noModule'].includes(attr)

function setAttributesFromProps(el: HTMLScriptElement, props: ScriptProps) {
  for (const [p, value] of Object.entries(props)) {
    if (ignoreProps.includes(p) || value === undefined) continue
    const attr = DOMAttributeNames[p] || p.toLowerCase()
    if (isBooleanScriptAttribute(attr)) {
      Reflect.set(el, attr, !!value)
    } else {
      el.setAttribute(attr, String(value))
    }
    // Setting then removing clears falsy booleans, including the implicit
    // force-async on dynamically inserted scripts.
    if (value === false || (isBooleanScriptAttribute(attr) && (!value || value === 'false'))) {
      el.setAttribute(attr, '')
      el.removeAttribute(attr)
    }
  }
}

const requestIdleCallback = (cb: () => void) => {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(cb)
  else window.setTimeout(cb, 1)
}

function loadScript(props: ScriptProps) {
  const {
    src,
    id,
    onLoad,
    onReady,
    dangerouslySetInnerHTML,
    children,
    strategy = 'afterInteractive',
    onError,
  } = props
  const cacheKey = id || src

  if (cacheKey && LoadCache.has(cacheKey)) return

  // Same remote script already loading: don't inject again, but still run
  // this instance's onLoad (in order) once it resolves.
  const pending = src ? ScriptCache.get(src) : undefined
  if (pending) {
    if (cacheKey) LoadCache.add(cacheKey)
    pending.then(() => onLoad?.(new Event('load')), onError)
    return
  }

  const afterLoad = () => {
    onReady?.()
    if (cacheKey) LoadCache.add(cacheKey)
  }

  const el = document.createElement('script')
  const loadPromise = new Promise<void>((resolve, reject) => {
    el.addEventListener('load', (e) => {
      resolve()
      onLoad?.(e)
      afterLoad()
    })
    el.addEventListener('error', (e) => reject(e))
  }).catch((e) => {
    onError?.(e)
  })

  if (dangerouslySetInnerHTML) {
    el.innerHTML = String(dangerouslySetInnerHTML.__html || '')
    afterLoad()
  } else if (children) {
    el.textContent =
      typeof children === 'string' ? children : Array.isArray(children) ? children.join('') : ''
    afterLoad()
  } else if (src) {
    el.src = src
    // Added to LoadCache only once the load event fires.
    ScriptCache.set(src, loadPromise)
  }

  setAttributesFromProps(el, props)
  el.setAttribute('data-nscript', strategy)
  document.body.appendChild(el)
}

function loadLazyScript(props: ScriptProps) {
  if (document.readyState === 'complete') {
    requestIdleCallback(() => loadScript(props))
  } else {
    window.addEventListener('load', () => requestIdleCallback(() => loadScript(props)), {
      once: true,
    })
  }
}

// eslint-disable-next-line no-restricted-exports
export default function Script(props: ScriptProps) {
  const { id, src = '', onReady, strategy = 'afterInteractive' } = props

  // Fire onReady on a remount when the script already loaded. The ref guards
  // against StrictMode's double effect run, as in Next.
  const hasOnReadyEffectCalled = useRef(false)
  useEffect(() => {
    const cacheKey = id || src
    if (!hasOnReadyEffectCalled.current) {
      if (onReady && cacheKey && LoadCache.has(cacheKey)) onReady()
      hasOnReadyEffectCalled.current = true
    }
  }, [onReady, id, src])

  const hasLoadScriptEffectCalled = useRef(false)
  useEffect(() => {
    if (hasLoadScriptEffectCalled.current) return
    hasLoadScriptEffectCalled.current = true
    if (strategy === 'lazyOnload') {
      loadLazyScript(props)
    } else {
      // Studio is a client-rendered SPA with no Next document to inject into
      // or Partytown worker, so beforeInteractive and worker scripts load
      // after mount like afterInteractive.
      loadScript(props)
    }
  }, [props, strategy])

  return null
}
