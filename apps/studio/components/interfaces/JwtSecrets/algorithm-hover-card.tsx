import { LockKeyholeOpen, RectangleEllipsis } from 'lucide-react'

import { InfoPill } from 'components/ui/InfoPill'
import { AlgorithmDetail, algorithmDetails } from './algorithm-details'

interface AlgorithmHoverCardProps {
  algorithm: keyof typeof algorithmDetails
  legacy?: boolean
}

export const AlgorithmHoverCard = ({ algorithm, legacy }: AlgorithmHoverCardProps) => {
  const details: AlgorithmDetail = algorithmDetails[algorithm]

  return (
    <InfoPill
      label={<span className="pt-1 h-6">{legacy ? `Legacy ${details.label}` : details.label}</span>}
      icon={
        algorithm === 'HS256' ? (
          <RectangleEllipsis className="size-4 flex-shrink-0" />
        ) : (
          <LockKeyholeOpen className="size-4 flex-shrink-0" />
        )
      }
      title={details.name}
      description={
        <div className="flex flex-col gap-2">
          <p>{details.description}</p>
          <p>
            Pros:
            <ul className="list-disc">
              {details.pros.map((pro, i) => (
                <li key={i}>{pro}</li>
              ))}
            </ul>
          </p>
          <p>
            Cons:{' '}
            <ul className="list-disc">
              {details.cons.map((con, i) => (
                <li key={i}>{con}</li>
              ))}
            </ul>
            <br />
          </p>
        </div>
      }
      links={details.links}
    />
  )
}
