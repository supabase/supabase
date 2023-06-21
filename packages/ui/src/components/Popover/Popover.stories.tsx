import { Button } from '../Button'
import { IconChevronDown } from '../Icon/icons/IconChevronDown'

import { Popover } from '.'
import { RootProps } from './Popover'
import { Input } from '../Input'

export default {
  title: 'Navigation/Popover',
  component: Popover,
}

export const Default = (args: RootProps) => (
  <div className="flex justify-center">
    <Popover
      {...args}
      side="bottom"
      align="end"
      size="content"
      showClose
      header={
        <div className="flex justify-between items-center">
          <Button type="default" size="tiny">
            Clear
          </Button>
          <h5 className="text-sm text-scale-1200">Filter</h5>
          <Button type="primary">Save</Button>
        </div>
      }
      overlay={[
        <>
          <div className="py-6 space-y-4">
            <Input
              className="px-3"
              size="tiny"
              label="Width"
              defaultValue="100%"
              descriptionText="Set the width of something"
              layout="horizontal"
            />
            <Popover.Separator />
            <Input
              className="px-3"
              size="tiny"
              label="Width"
              defaultValue="100%"
              descriptionText="Set the width of something"
              layout="horizontal"
            />
            <Popover.Separator />
            <Input
              className="px-3"
              size="tiny"
              label="Width"
              defaultValue="100%"
              descriptionText="Set the width of something"
              layout="horizontal"
            />
          </div>
        </>,
      ]}
    >
      <Button asChild type="default" iconRight={<IconChevronDown />}>
        <span>Click for Popover</span>
      </Button>
    </Popover>
  </div>
)

export const Modal = (args: RootProps) => (
  <div className="flex justify-center">
    <Popover
      {...args}
      side="bottom"
      align="end"
      size="content"
      showClose
      modal
      header={
        <div className="flex justify-between items-center">
          <h5 className="text-sm text-scale-1200">Modal Popover</h5>
          <Popover.Close />
        </div>
      }
      overlay={
        <div className='p-3 px-4'>
          <div className="py-6 space-y-4">
            <Input
              className="px-3"
              size="tiny"
              label="Width"
              defaultValue="100%"
              descriptionText="Set the width of something"
              layout="horizontal"
            />
            <Popover.Separator />
            <Input
              className="px-3"
              size="tiny"
              label="Height"
              defaultValue="100px"
              descriptionText="Set the height of something"
              layout="horizontal"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="primary">Save</Button>
            <Button type="default" className="ml-2">
              Cancel
            </Button>
          </div>
        </div>
      }
    >
      <Button as="span" type="default" iconRight={<IconChevronDown />}>
        Click for Modal Popover
      </Button>
    </Popover>
  </div>
)

Modal.args = {}
