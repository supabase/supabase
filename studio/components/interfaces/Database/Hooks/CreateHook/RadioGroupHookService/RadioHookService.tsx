import Image from 'next/image'
import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Radio, Badge } from 'ui'
import { CreateHookContext } from '../'

interface Props {
  id: string
  description: string
  label: string
  img_url: string
  badgeType: 'brand' | 'amber'
  badge: string
}

const RadioHookService: FC<Props> = observer(
  ({ id, description, label, img_url, badgeType, badge }) => {
    const _localState: any = useContext(CreateHookContext)
    return (
      <Radio
        id={id}
        value={id}
        checked={_localState.formState.hookService.value == id}
        // @ts-ignore
        beforeLabel={
          <>
            <div className="flex items-center space-x-5">
              {/* <div className="h-3 w-3"> */}
              <Image
                src={`/img/function-providers/${img_url}`}
                layout="fixed"
                width="32"
                height="32"
              />
              {/* </div> */}
              <div className="flex-col space-y-0">
                <div className="flex space-x-1">
                  <span className="text-scale-1200">{label}</span>
                  <Badge color={badgeType}>{badge}</Badge>
                </div>
                <span className="text-scale-900">{description}</span>
              </div>
            </div>
          </>
        }
      />
    )
  }
)

export default RadioHookService
