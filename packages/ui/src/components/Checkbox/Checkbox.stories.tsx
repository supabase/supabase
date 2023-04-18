import { Checkbox } from '.'

export default {
  title: 'Data Input/Checkbox',
  component: Checkbox,
}

export const Default = (args: any) => <Checkbox {...args} />

export const withGroup = (args: any) => (
  <Checkbox.Group {...args}>
    <Checkbox
      id="checkbox1"
      name="checkbox1"
      label="JavaScript"
      description="JavaScript, often abbreviated as JS, is a programming language that conforms to the ECMAScript specification."
    />
    <Checkbox
      id="checkbox2"
      name="checkbox2"
      label="Typescript"
      description="TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static typing to the language. "
    />
    <Checkbox
      id="checkbox3"
      name="checkbox3"
      label="React"
      description="React is an open-source, front end, JavaScript library for building user interfaces or UI components. It is maintained by Facebook and a community of individual developers and companies."
    />
  </Checkbox.Group>
)

export const withGroupHorizontal = (args: any) => (
  <Checkbox.Group {...args}>
    <Checkbox
      id="checkbox1"
      name="checkbox1"
      label="JavaScript"
      description="JavaScript, often abbreviated as JS, is a programming language that conforms to the ECMAScript specification."
    />
    <Checkbox
      id="checkbox2"
      name="checkbox2"
      label="Typescript"
      description="TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static typing to the language. "
    />
    <Checkbox
      id="checkbox3"
      name="checkbox3"
      label="React"
      description="React is an open-source, front end, JavaScript library for building user interfaces or UI components. It is maintained by Facebook and a community of individual developers and companies."
    />
  </Checkbox.Group>
)

export const size = (args: any) => (
  <Checkbox.Group {...args}>
    <Checkbox
      id="checkbox1"
      name="checkbox1"
      label="JavaScript"
      description="JavaScript, often abbreviated as JS, is a programming language that conforms to the ECMAScript specification."
    />
    <Checkbox
      id="checkbox2"
      name="checkbox2"
      label="Typescript"
      description="TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static typing to the language. "
    />
    <Checkbox
      id="checkbox3"
      name="checkbox3"
      label="React"
      description="React is an open-source, front end, JavaScript library for building user interfaces or UI components. It is maintained by Facebook and a community of individual developers and companies."
    />
  </Checkbox.Group>
)

export const withBeforeAndAfterLabels = (args: any) => <Checkbox.Group {...args} />

Default.args = {
  label: 'This is the label',
  description: 'This is the description',
}

withGroup.args = {
  id: 'checkobox-q',
  label: 'This is the label',
  description: 'This is the description',
  disabled: false,
  size: 'medium',
  className: 'font-sans',
  layout: 'vertical',
}

withGroupHorizontal.args = {
  id: 'checkobox-q',
  label: 'This is the label',
  description: 'This is the description',
  disabled: false,
  className: 'font-sans',
  layout: 'horizontal',
}

size.args = {
  id: 'checkobox-q',
  label: 'Control the size of the checkboxes',
  description: 'You can add a size just the Group component and it will affect the children',
  disabled: false,
  className: 'font-sans',
  layout: 'horizontal',
  size: 'tiny',
}

withBeforeAndAfterLabels.args = {
  label: 'Label',
  beforeLabel: 'Before : ',
  afterLabel: ' : After',
  options: [
    {
      label: 'Label',
      beforeLabel: 'Before : ',
      afterLabel: ' : After',
      description: 'Description',
    },
  ],
  className: 'font-sans',
}
