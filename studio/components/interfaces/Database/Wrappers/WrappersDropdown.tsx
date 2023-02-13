import Link from 'next/link'
import Image from 'next/image'
import { FC, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, IconPlus } from 'ui'

import { useParams } from 'hooks'
import { WRAPPERS } from './Wrappers.constants'

interface Props {
  buttonText?: string
  align?: 'center' | 'end'
}

const WrapperDropdown: FC<Props> = ({ buttonText = 'Add wrapper', align = 'end' }) => {
  const { ref } = useParams()

  return (
    <Dropdown
      side="bottom"
      align={align}
      size="small"
      overlay={
        <>
          {WRAPPERS.map((wrapper, idx) => (
            <Fragment key={idx}>
              <Link
                href={`/project/${ref}/database/wrappers/new?type=${wrapper.name.toLowerCase()}`}
              >
                <a>
                  <Dropdown.Item
                    key={wrapper.name}
                    icon={
                      <Image
                        src={wrapper.icon}
                        width={20}
                        height={20}
                        alt={`${wrapper.name} wrapper icon`}
                      />
                    }
                  >
                    {wrapper.label}
                  </Dropdown.Item>
                </a>
              </Link>
              {idx !== WRAPPERS.length - 1 && <Dropdown.Separator />}
            </Fragment>
          ))}
        </>
      }
    >
      <Button type="primary" icon={<IconPlus strokeWidth={1.5} />}>
        {buttonText}
      </Button>
    </Dropdown>
  )
}

export default observer(WrapperDropdown)
