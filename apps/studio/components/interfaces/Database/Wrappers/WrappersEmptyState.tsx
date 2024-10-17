import { useParams } from 'common'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from 'ui'
import { WRAPPERS } from './Wrappers.constants'
import CardButton from 'components/ui/CardButton'

const WrappersEmptyState = () => {
  const { ref } = useParams()

  return (
    <div className="flex flex-col gap-4">
      <hr />
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-xl">No wrappers created yet</h2>
        <p className="prose text-sm">Create a new wrapper by choosing one below</p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {WRAPPERS.map((wrapper) => (
          <CardButton
            linkHref={`/project/${ref}/database/wrappers/new?type=${wrapper.name.toLowerCase()}`}
            title={wrapper.label}
            fixedHeight={false}
          >
            <div className="flex items-center justify-center mt-3 mb-1">
              <Image
                width={40}
                height={40}
                src={wrapper.icon}
                alt={`${wrapper.name} wrapper icon`}
              />
            </div>
          </CardButton>
        ))}
      </div>
    </div>
  )
}

export default WrappersEmptyState
