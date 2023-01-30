import { Button } from '../Button'
import { Divider } from '../Divider'
import { IconChevronDown } from '../../index'
import Typography from '../Typography'

import { Popover } from '.'
import { IconLogIn } from '../Icon/icons/IconLogIn'
import { Input } from '../Input'

export default {
  title: 'Navigation/Popover',
  component: Popover,
}

export const Default = (args: any) => (
  <div className="flex justify-center">
    <Popover
      {...args}
      side="bottom"
      align="end"
      size="content"
      portalled
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
      <Button as="span" type="default" iconRight={<IconChevronDown />}>
        Click for Popover
      </Button>
    </Popover>
  </div>
)

Default.args = {}
