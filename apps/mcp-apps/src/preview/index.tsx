import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import '../styles.css'

const previews = [
  { title: 'Projects sidebar', src: '/surfaces/projects.html?preview=1', height: 640 },
  {
    title: 'Project workspace (deep link)',
    src: '/surfaces/projects.html?preview=1&route=%2Fprojects%2Fsales-pipeline%3Fschema%3Dpublic%26table%3Dcompanies',
    height: 640,
  },
  { title: 'Project home panel', src: '/surfaces/panel.html?preview=home', height: 640 },
  { title: 'Issues panel', src: '/surfaces/panel.html?preview=issues', height: 420 },
  { title: 'Notebooks panel', src: '/surfaces/panel.html?preview=notebooks', height: 420 },
  { title: 'Explorer panel', src: '/surfaces/panel.html?preview=explorer', height: 560 },
  { title: 'SQL panel', src: '/surfaces/panel.html?preview=sql', height: 480 },
  { title: 'Logs panel', src: '/surfaces/panel.html?preview=logs', height: 480 },
  { title: 'Row panel', src: '/surfaces/panel.html?preview=row', height: 520 },
  // Inline resources set prefersBorder: false, so hosts draw no frame around them, and
  // the SDK reports their content height so the host can size them.
  {
    title: 'Inline query block',
    src: '/surfaces/query-block.html?preview=block',
    height: 360,
    isInline: true,
  },
]

type Preview = (typeof previews)[number] & { isInline?: boolean }

/**
 * Embeds a surface like a host would. Inline frames follow their content height,
 * as hosts do with the MCP Apps size-changed notification; the preview is
 * same-origin, so the gallery can observe the document directly.
 */
function PreviewFrame({ preview }: { preview: Preview }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(preview.height)

  useEffect(() => {
    const element = frame.current
    if (!preview.isInline || !element) return
    let observer: ResizeObserver | undefined
    const observe = () => {
      const body = element.contentDocument?.body
      if (!body) return
      observer?.disconnect()
      observer = new ResizeObserver(() => setHeight(body.scrollHeight))
      observer.observe(body)
    }
    element.addEventListener('load', observe)
    observe()
    return () => {
      element.removeEventListener('load', observe)
      observer?.disconnect()
    }
  }, [preview.isInline])

  return (
    <iframe
      ref={frame}
      title={preview.title}
      src={preview.src}
      className={preview.isInline ? 'w-full' : 'w-full rounded-lg border'}
      style={{ height }}
    />
  )
}

/** Development gallery: each surface in its own frame, as a host would embed it. */
function Gallery() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-xl text-foreground">Supabase surfaces</h1>
        <p className="text-sm text-foreground-light">
          Fixture data, no host. Build with <code>pnpm --filter mcp-apps build</code> to test in an
          MCP host.
        </p>
      </header>
      {previews.map((preview) => (
        <section key={preview.src} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-foreground">{preview.title}</h2>
            <a
              className="text-xs text-foreground-light underline"
              href={preview.src}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </div>
          <PreviewFrame preview={preview} />
        </section>
      ))}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Gallery />)
