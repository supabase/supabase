import { Button } from '../Button'
import { Divider } from './'

export default {
  title: 'Utilities/Divider',
  component: Divider,
}

export const Default = (args: any) => <Divider {...args} />

export const withCenterText = (args: any) => <Divider {...args}>Hello world</Divider>

export const withLeftText = (args: any) => <Divider {...args}>Hello world</Divider>

export const withRightText = (args: any) => <Divider {...args}>Hello world</Divider>

export const lighterColor = (args: any) => <Divider {...args} />

export const vertical = (args: any) => (
  <div style={{ height: '32px' }}>
    <div className="space-x-3 w-full">
      <Divider {...args} />
      <Button>Button one</Button>
      <Divider {...args} />
      <Button>Button two</Button>
      <Divider {...args} />
      <span>Some text</span>
      <Divider {...args} />
      <Button>Button three</Button>
    </div>
  </div>
)

Default.args = {}

withCenterText.args = {}

withLeftText.args = {
  orientation: 'left',
}

withRightText.args = {
  orientation: 'right',
}

lighterColor.args = {
  light: true,
}

vertical.args = {
  type: 'vertical',
}
