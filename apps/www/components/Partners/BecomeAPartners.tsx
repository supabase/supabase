import { Button, Form, Input, InputNumber, Listbox } from 'ui'
import { useState } from 'react'
import countries from '~/data/Countries.json'
import { SupabaseClient } from '~/lib/supabase'

const INITIAL_VALUES = {
  type: 'expert',
  first: '',
  last: '',
  company: '',
  size: '',
  title: '',
  email: '',
  phone: '',
  country: 'US',
  details: '',
}

const validate = (values: any) => {
  const errors: any = {}

  if (!values.first) {
    errors.first = 'Required'
  }

  if (!values.last) {
    errors.last = 'Required'
  }

  if (!values.email) {
    errors.email = 'Required'
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = 'Invalid email address'
  }

  return errors
}

export default function BecomeAPartner({ supabase }: { supabase: SupabaseClient }) {
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)

  const handleFormSubmit = async (values: any) => {
    const { error } = await supabase.from('partner_contacts').insert([
      {
        type: values.type,
        first: values.first,
        last: values.last,
        company: values.company,
        size: Number(values.size),
        title: values.title,
        email: values.email,
        website: values.email.split('@')[1],
        phone: values.phone,
        country: values.country,
        details: values.details,
      },
    ])

    // TODO: handle error
    console.log('error:', error)

    setFormSubmitted(true)
  }

  return (
    <div className="border-t">
      <div id="become-a-partner" className="mx-auto max-w-2xl space-y-12 py-12 px-6">
        <h2 className="h2">Become a Partner</h2>

        <Form initialValues={INITIAL_VALUES} validate={validate} onSubmit={handleFormSubmit}>
          {({ isSubmitting }: any) => (
            <div className="flex flex-col space-y-4">
              <div>
                <Listbox
                  id="type"
                  name="type"
                  className="font-sans"
                  label="What type of partner are you?"
                  layout="vertical"
                >
                  <Listbox.Option label="Expert (Agency &amp; Consulting)" value="expert">
                    Expert (Agency &amp; Consulting)
                  </Listbox.Option>
                  <Listbox.Option label="Technology" value="technology">Technology</Listbox.Option>
                </Listbox>
              </div>

              <div className="flex space-x-2 sm:space-x-4">
                <div className="flex-1">
                  <Input
                    label="First Name *"
                    id="first"
                    name="first"
                    layout="vertical"
                    placeholder="Jane"
                  />
                </div>

                <div className="flex-1">
                  <Input
                    label="Last Name *"
                    id="last"
                    name="last"
                    layout="vertical"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="flex space-x-2 sm:space-x-4">
                <div className="flex-1">
                  <Input
                    label="Company Name"
                    id="company"
                    name="company"
                    layout="vertical"
                    placeholder="Supa Inc."
                  />
                </div>

                <div className="flex-1">
                  <InputNumber
                    label="Company Size"
                    id="size"
                    name="size"
                    layout="vertical"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex space-x-2 sm:space-x-4">
                <div className="flex-1">
                  <Input
                    label="Job Title"
                    id="title"
                    name="title"
                    layout="vertical"
                    placeholder="CEO"
                  />
                </div>

                <div className="flex-1">
                  <Input
                    label="Business email *"
                    id="email"
                    name="email"
                    layout="vertical"
                    placeholder="janedoe@example.sg"
                  />
                </div>
              </div>

              <div>
                <Input
                  label="Phone Number"
                  id="phone"
                  name="phone"
                  layout="vertical"
                  placeholder="+65 1234 1234"
                />
              </div>

              <div>
                <Listbox
                  label="Country / Main Timezone"
                  id="country"
                  name="country"
                  layout="vertical"
                >
                  {countries.map(({ code, name }: any, i: number) => (
                    <Listbox.Option key={i} label={name} value={code}>
                      {name}
                    </Listbox.Option>
                  ))}
                </Listbox>
              </div>

              <div className="col-span-2">
                <Input.TextArea
                  id="details"
                  name="details"
                  label="Additional Details"
                  placeholder="Tell us about your projects, clients, and technology..."
                  rows={10}
                />
              </div>

              <div className="col-span-2 flex w-full flex-row-reverse pt-4">
                <Button
                  size="xlarge"
                  disabled={formSubmitted}
                  loading={isSubmitting}
                  htmlType="submit"
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </Form>

        {formSubmitted && <h3 className="h3">Thanks, we'll reach out to you shortly 👁⚡️👁</h3>}
      </div>
    </div>
  )
}
