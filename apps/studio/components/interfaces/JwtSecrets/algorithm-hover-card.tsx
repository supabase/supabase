import { ExternalLink, HelpCircle, LockKeyholeOpen, RectangleEllipsis } from 'lucide-react'

import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import { AlgorithmDetail, algorithmDetails } from './algorithm-details'

interface AlgorithmHoverCardProps {
  algorithm: keyof typeof algorithmDetails
  legacy?: boolean
}

export const AlgorithmHoverCard = ({ algorithm, legacy }: AlgorithmHoverCardProps) => {
  const details: AlgorithmDetail = algorithmDetails[algorithm]

  return (
    <div className="flex items-center gap-x-2">
      {algorithm === 'HS256' ? (
        <RectangleEllipsis className="flex-shrink-0" size={14} />
      ) : (
        <LockKeyholeOpen className="flex-shrink-0" size={14} />
      )}
      <p>{legacy ? `Legacy ${details.label}` : details.label}</p>
      <HoverCard closeDelay={50} openDelay={300}>
        <HoverCardTrigger className="min-w-0">
          <HelpCircle size={14} className="text-foreground-lighter" />
        </HoverCardTrigger>
        <HoverCardContent className="w-[22rem] flex items-start gap-3" side="right" align="center">
          <div className="flex-1">
            <h4 className="font-semibold truncate">{details.name}</h4>
            <div className="flex flex-col gap-2 text-sm text-foreground-light">
              <p>{details.description}</p>
              <p>
                Pros:
                <ul className="list-disc pl-6">
                  {details.pros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))}
                </ul>
              </p>
              <p>
                Cons:{' '}
                <ul className="list-disc pl-6">
                  {details.cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
                <br />
              </p>
            </div>
            <div className="space-y-1 mt-2">
              {details.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand hover:text-brand-600 flex items-center"
                >
                  <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
