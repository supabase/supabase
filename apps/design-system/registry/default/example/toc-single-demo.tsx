'use client'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { Toc, TOCItems, TOCScrollArea } from 'ui-patterns'

export default function MultiSelectDemo() {
  return (
    <TocAnchorsProvider>
      <div
        id="example-toc-single-demo"
        className="p-4 md:p-8 grid md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto"
      >
        <div className="md:col-span-3">
          <div className="prose max-w-none">
            <h1>Getting Started with Cloud Computing</h1>

            <h2 id="single-introduction">
              Introduction
              <a
                href="#single-introduction"
                aria-hidden="true"
                className="ml-2 opacity-0 group-hover:opacity-100 transition"
              >
                <span aria-hidden="true">#</span>
              </a>
            </h2>
            <p>
              Cloud computing has revolutionized how we build and deploy applications. This guide
              will walk you through the fundamental concepts and best practices.
            </p>

            <h2 id="single-key-concepts">
              Key Concepts
              <a
                href="#single-key-concepts"
                aria-hidden="true"
                className="ml-2 opacity-0 group-hover:opacity-100 transition"
              >
                <span aria-hidden="true">#</span>
              </a>
            </h2>
            <p>
              Before diving deep into cloud services, it's important to understand the basic
              building blocks that make cloud computing possible.
            </p>

            <h3 id="single-iaas">
              Infrastructure as a Service (IaaS)
              <a
                href="#single-iaas"
                aria-hidden="true"
                className="ml-2 opacity-0 group-hover:opacity-100 transition"
              >
                <span aria-hidden="true">#</span>
              </a>
            </h3>
            <p>
              IaaS provides virtualized computing resources over the internet. This includes virtual
              machines, storage, and networking.
            </p>

            <h3 id="single-paas">
              Platform as a Service (PaaS)
              <a
                href="#single-paas"
                aria-hidden="true"
                className="ml-2 opacity-0 group-hover:opacity-100 transition"
              >
                <span aria-hidden="true">#</span>
              </a>
            </h3>
            <p>
              PaaS delivers a platform allowing customers to develop, run, and manage applications
              without dealing with infrastructure.
            </p>

            <h2 id="single-best-practices">
              Best Practices
              <a
                href="#single-best-practices"
                aria-hidden="true"
                className="ml-2 opacity-0 group-hover:opacity-100 transition"
              >
                <span aria-hidden="true">#</span>
              </a>
            </h2>
            <p>
              Following cloud computing best practices ensures optimal performance, security, and
              cost-effectiveness.
            </p>

            <h3 id="single-security">
              Security Considerations
              <a
                href="#single-security"
                aria-hidden="true"
                className="ml-2 opacity-0 group-hover:opacity-100 transition"
              >
                <span aria-hidden="true">#</span>
              </a>
            </h3>
            <p>
              Security should be your top priority when working with cloud services. Implement
              proper authentication, encryption, and access controls.
            </p>

            <h3 id="single-cost-optimization">
              Cost Optimization
              <a
                href="#single-cost-optimization"
                aria-hidden="true"
                className="ml-2 opacity-0 group-hover:opacity-100 transition"
              >
                <span aria-hidden="true">#</span>
              </a>
            </h3>
            <p>
              Learn how to optimize your cloud spending through resource planning, monitoring, and
              implementing cost-saving strategies.
            </p>

            <h2 id="single-conclusion">
              Conclusion
              <a
                href="#single-conclusion"
                aria-hidden="true"
                className="ml-2 opacity-0 group-hover:opacity-100 transition"
              >
                <span aria-hidden="true">#</span>
              </a>
            </h2>
            <p>
              Cloud computing continues to evolve, offering new possibilities for businesses and
              developers alike. Stay updated with the latest trends and best practices.
            </p>
          </div>
        </div>
        <TocComponent />
      </div>
    </TocAnchorsProvider>
  )
}

const TocComponent = () => {
  const { toc } = useTocAnchors()

  return (
    <Toc className="sticky top-0 border-l">
      <h3 className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-foreground pl-[calc(1.5rem+6px)]">
        On this page
      </h3>
      <TOCScrollArea className="-ml-[2px]">
        <TOCItems items={toc} />
      </TOCScrollArea>
    </Toc>
  )
}

import { type AnchorProviderProps, AnchorProvider } from 'ui-patterns'

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

const TocAnchorsContext = createContext<AnchorProviderProps | undefined>(undefined)

const useTocAnchors = () => {
  const context = useContext(TocAnchorsContext)
  if (!context) {
    throw new Error('useTocAnchors must be used within an TocAnchorsContext')
  }
  return context
}

const TocAnchorsProvider = ({ children }: PropsWithChildren) => {
  const [tocList, setTocList] = useState<TOCHeader[]>([])

  const toc = tocList.map((item) => ({
    title: item.text,
    url: item.link,
    depth: item.level,
  }))

  useEffect(() => {
    /**
     * Because we're directly querying the DOM, needs the setTimeout so the DOM
     * update will happen first.
     */
    const timeoutHandle = setTimeout(() => {
      const headings = Array.from(
        document.querySelector('#example-toc-single-demo')?.querySelectorAll('h2, h3') ?? []
      )

      const newHeadings = headings
        .filter((heading) => heading.id)
        .map((heading) => {
          const text = heading?.textContent?.replace('#', '')
          const link = heading.querySelector('a')?.getAttribute('href')
          if (!link) return null

          const level = heading.tagName === 'H2' ? 2 : 3

          return { text, link, level } as Partial<TOCHeader>
        })
        .filter((x): x is TOCHeader => !!x && !!x.text && !!x.link && !!x.level)

      setTocList(newHeadings)
    }, 100)

    return () => clearTimeout(timeoutHandle)
    /**
     * window.location.href needed to recalculate toc when page changes,
     * `useSubscribeTocRerender` above will trigger the rerender
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof window !== 'undefined' && window.location.href])

  return (
    <TocAnchorsContext.Provider value={{ toc }}>
      <AnchorProvider toc={toc} single={true}>
        {children}
      </AnchorProvider>
    </TocAnchorsContext.Provider>
  )
}
