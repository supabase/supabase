import { Form } from '.'
import { Input, Button, InputNumber, Toggle, Checkbox, Radio, Select, Listbox } from '../../index'

import * as Yup from 'yup'
import { User } from '../Icon/IconImportHandler'
import React from 'react'

export default {
  title: 'Data Input/Form',
  component: Form,
}

interface Values {
  email: string
  last_name: string
  profession: string
  number: number | undefined
  // remember_me: boolean
  checkbox_alone: boolean
  favorite_food: string
  check_3: boolean
  check_2: boolean
  check_1: boolean
  textarea: string
  toggle: boolean
  people: number | undefined
}

const INITIAL_VALUES: Values = {
  email: '',
  last_name: '',
  profession: '',
  number: undefined,
  checkbox_alone: false,
  // remember_me: false,
  favorite_food: '',
  check_3: false,
  check_2: true,
  check_1: false,
  textarea: '',
  toggle: true,
  people: undefined,
}

export const InputLevelValidation = () => {
  function validateEmail(value: string) {
    console.log('validateEmail running')
    let error
    if (!value) {
      error = 'Required'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
      error = 'Invalid email address'
    }
    return error
  }

  return (
    <Form
      initialValues={{
        email: '',
        firstname: '',
      }}
      validateOnBlur
      onSubmit={(values: any, { setSubmitting }: any) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2))
          setSubmitting(false)
        }, 400)
      }}
    >
      {({ isSubmitting }: { isSubmitting: boolean }) => (
        <div className="space-y-4">
          <Input
            id="email"
            label="email"
            placeholder="something in here"
            labelOptional="This is a required field"
            validation={validateEmail}
          />
          {/* <Input
            id="firstname"
            label="firstname"
            placeholder="something in here"
          /> */}
          <Button loading={isSubmitting} type="primary" htmlType="submit">
            Submit
          </Button>
        </div>
      )}
    </Form>
  )
}

export const InputLevelValidationYip = () => {
  // validation schema
  const SignupSchema = Yup.object().shape({
    firstname: Yup.string().min(2, 'Too Short!').max(50, 'Too Long!').required('Required'),
    lastname: Yup.string().min(2, 'Too Short!').max(50, 'Too Long!').required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
  })

  return (
    <Form
      initialValues={{
        firstname: '',
        lastname: '',
        email: '',
      }}
      validationSchema={SignupSchema}
      onSubmit={(values: any, { setSubmitting }: any) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2))
          setSubmitting(false)
        }, 400)
      }}
    >
      {({ isSubmitting }: any) => (
        <div className="space-y-4">
          <Input id="firstname" name="firstname" label="firstname" placeholder="firstname" />
          <Input id="lastname" name="lastname" label="lastname" placeholder="lastname" />
          <Input id="email" name="email" label="Email" placeholder="This is your email" />
          <Button loading={isSubmitting} type="primary" htmlType="submit">
            Submit
          </Button>
        </div>
      )}
    </Form>
  )
}

const people = [
  {
    value: 1,
    label: 'Wade Cooper',
    avatar:
      'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 2,
    label: 'Arlene Mccoy',
    avatar:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 3,
    label: 'Devon Webb',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80',
  },
  {
    value: 4,
    label: 'Tom Cook',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 5,
    label: 'Tanya Fox',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 6,
    label: 'Hellen Schmidt',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 7,
    label: 'Caroline Schultz',
    avatar:
      'https://images.unsplash.com/photo-1568409938619-12e139227838?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 8,
    label: 'Mason Heaney',
    avatar:
      'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 9,
    label: 'Claudie Smitham',
    avatar:
      'https://images.unsplash.com/photo-1584486520270-19eca1efcce5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 10,
    label: 'Emil Schaefer',
    avatar:
      'https://images.unsplash.com/photo-1561505457-3bcad021f8ee?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
]

export const LargerExample = () => {
  return (
    <>
      <Form
        initialValues={INITIAL_VALUES}
        onSubmit={(values: any, { setSubmitting }: any) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2))
            setSubmitting(false)
          }, 400)
        }}
        validate={(values: Values) => {
          const errors: any = {}

          console.log('values for validation', values)

          if (!values.email) {
            errors.email = 'Required'
          } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
            errors.email = 'Invalid email address'
          }

          if (!values.profession) {
            errors.profession = 'Required'
          }

          if (!values.textarea) {
            errors.textarea = 'Required'
          }

          if (!values.number) {
            errors.number = 'Required'
          }

          if (values.number <= 13) {
            errors.number = 'Must be a number above 13'
          }

          if (values.number >= 32) {
            errors.number = 'Must be a number below 32'
          }

          if (!values.favorite_food) {
            errors.favorite_food = 'You must select a favourite food'
          }

          if (!values.toggle) {
            errors.toggle = 'This needs to be turned on'
          }

          // if (!values.people) {
          //   errors.people = 'Please select a person'
          // }

          // if (values.remember_me)

          return errors
        }}
      >
        {({ isSubmitting }: any) => (
          <>
            <div className="space-y-8">
              <p>{isSubmitting ? 'submitting' : 'not submitting'}</p>
              <Input id="email" label="Email" placeholder="something@gmail.com" />
              <Input id="last_name" label="last name" placeholder="something in here" />
              <Select id="profession" label="Profession" placeholder="something in here">
                <Select.Option key="empty-enum" value="">
                  ---
                </Select.Option>
                <Select.Option value="teacher">Teacher</Select.Option>
                <Select.Option value="firefighter">Firefighter</Select.Option>
                <Select.Option value="police">Police</Select.Option>
              </Select>
              <InputNumber
                id="number"
                label="Number"
                placeholder="124"
                labelOptional="Must be between 13 - 31"
              />
              <Checkbox id="checkbox_alone" label="checkbox_alone" />
              <Input.TextArea id="textarea" rows={5} name="textarea" />
              <Checkbox.Group
                label="Group of checkboxes"
                layout="horizontal"
                labelOptional="Optional label"
                descriptionText="You can also show label hint text here"
              >
                <Checkbox
                  name="check_1"
                  id="check_1"
                  label="Remember me"
                  description="hello world"
                />
                <Checkbox
                  name="check_2"
                  id="check_2"
                  label="Remember me"
                  description="hello world"
                />
                <Checkbox
                  name="check_3"
                  id="check_3"
                  label="Remember me"
                  description="hello world"
                />
              </Checkbox.Group>
              <Toggle id="toggle" label="Remember me" layout="horizontal" />
              <Radio.Group
                layout="horizontal"
                name="favorite_food"
                label="favorite_food"
                type="list"
              >
                <Radio value="pizza" label="Pizza" description="hello world" />
                <Radio value="burger" label="Burger" description="hello world" />
                <Radio value="fries" label="Fries" description="hello world" />
              </Radio.Group>

              <Listbox
                id="people"
                label="Choose a person"
                layout="horizontal"
                descriptionText="Choose a person for this role"
              >
                {people.map((person) => {
                  return (
                    <Listbox.Option
                      key={`people-${person.value}`}
                      value={person.value}
                      label={person.label}
                      addOnBefore={({ active, selected }: any) => (
                        <img src={person.avatar} alt="" className="h-6 w-6 rounded-full" />
                      )}
                      children={({ active, selected }: any) => {
                        // console.log('selected', selected)
                        // console.log('active', active)
                        return <span className={'font-normal block truncate'}>{person.label}</span>
                      }}
                    />
                  )
                })}
              </Listbox>

              <Button loading={isSubmitting} type="primary" htmlType="submit">
                Submit
              </Button>
            </div>
          </>
        )}
      </Form>
    </>
  )
}

export const CardForm = () => {
  // panel
  const Panel = ({
    children,
    header,
    footer,
  }: {
    children: React.ReactNode
    header?: React.ReactNode
    footer?: React.ReactNode
  }) => (
    <div className="bg-surface-100 border border-overlay rounded-md w-3/4 mx-auto my-8 shadow overflow-hidden">
      {header && <div className="bg-surface-100 px-8 py-4 border-b border-overlay">{header}</div>}
      <div className="space-y-6 py-6">{children}</div>
      {footer}
    </div>
  )

  const Section = ({
    children,
    header,
  }: {
    children: React.ReactNode
    header?: React.ReactNode
  }) => (
    <div className="grid grid-cols-12 px-8 py-2">
      {header}
      {children}
    </div>
  )

  return (
    <>
      <Form
        initialValues={{ stripe_email_choice: 'emails-2' }}
        onSubmit={(values: any, { setSubmitting }: any) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2))
            setSubmitting(false)
          }, 400)
        }}
        validate={(values: Values) => {
          const errors: any = {}

          return errors
        }}
      >
        {({ isSubmitting }: any) => (
          <Panel
            header={
              <>
                <h3 className="text-foreground text-xl font-semibold">Custom Options</h3>
                <p className="text-foreground-muted">
                  These settings apply to payment pages you create using Stripe Checkout and Payment
                  Links.
                </p>
              </>
            }
            footer={
              <>
                <div className="border-t border-muted"></div>
                <div className="py-3 px-6 flex gap-2 justify-end">
                  <Button loading={isSubmitting} type="secondary" htmlType="submit">
                    Cancel
                  </Button>
                  <Button loading={isSubmitting} type="primary" htmlType="submit">
                    Save
                  </Button>
                </div>
              </>
            }
          >
            {/* <p>{isSubmitting ? 'submitting' : 'not submitting'}</p> */}
            {/* <div className="border-t border-muted"></div> */}
            <Section
              header={<label className="text-sm text-foreground col-span-4">Faster checkout</label>}
            >
              <Toggle
                className="col-span-8"
                id="link_with_stripe"
                label="Turn on link with Stripe"
                layout="flex"
                descriptionText="Go to Payment methods settings to configure Apple Pay and Google Pay."
              />
            </Section>
            <div className="border-t border-muted"></div>
            <Section
              header={<label className="text-sm text-foreground col-span-4">Faster checkout</label>}
            >
              <Radio.Group
                className="col-span-8"
                name="stripe_email_choice"
                id="stripe_email_choice"
                type="list"
                layout="vertical"
              >
                <Radio
                  // id="1642469211631"
                  value="emails-1"
                  label="Send emails about upcoming renewals"
                  description="hello world"
                  align="horizontal"
                />
                <Radio
                  // id="1642469211606"
                  value="emails-2"
                  label="Send emails about expiring cards"
                  description="hello world"
                  align="horizontal"
                />
              </Radio.Group>
            </Section>
            <div className="border-t border-muted"></div>
            <Section
              header={<label className="text-sm text-foreground col-span-4">Faster checkout</label>}
            >
              <div className="col-span-8 space-y-4">
                <Input name="app_id" label="Application ID in Stripe" />
                <Input
                  name="service_id"
                  label="API key"
                  descriptionText={
                    <span>
                      This can be found in{' '}
                      <span className="text-brand underline cursor-pointer transition hover:text-brand-300">
                        the developer settings
                      </span>
                    </span>
                  }
                />
              </div>
            </Section>
          </Panel>
        )}
      </Form>
    </>
  )
}

export { default as AuthForm } from './examples/AuthForm'
