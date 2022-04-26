import { SupabaseClient } from '@supabase/supabase-js'
import { Button, Form, Input, InputNumber, Select } from '@supabase/ui'
import { useState } from 'react'
import countries from '~/data/Countries.json'
import { PartnerContact } from '~/types/partners'

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
    const { error } = await supabase.from<PartnerContact>('partner_contacts').insert(
      [
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
      ],
      { returning: 'minimal' }
    )

    // TODO: handle error
    console.log('error:', error)

    setFormSubmitted(true)
  }

  return (
    <div className="border-t">
      <div id="become-a-partner" className="max-w-2xl mx-auto space-y-12 py-12 px-6">
        <h2 className="h2">Become a Partner</h2>

        <Form initialValues={INITIAL_VALUES} validate={validate} onSubmit={handleFormSubmit}>
          {({ isSubmitting }: any) => (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="h-24 col-span-2">
                <Select
                  id="type"
                  name="type"
                  className="font-sans"
                  label="What type of partner are you?"
                  layout="vertical"
                >
                  <Select.Option value="expert" selected={true}>
                    Expert (Agency &amp; Consulting)
                  </Select.Option>
                  <Select.Option value="technology">Technology</Select.Option>
                </Select>
              </div>

              <div className="h-24">
                <Input
                  label="First Name *"
                  id="first"
                  name="first"
                  layout="vertical"
                  placeholder="Jane"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Last Name *"
                  id="last"
                  name="last"
                  layout="vertical"
                  placeholder="Doe"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Company Name"
                  id="company"
                  name="company"
                  layout="vertical"
                  placeholder="Supa Inc."
                />
              </div>

              <div className="h-24">
                <InputNumber
                  label="Company Size"
                  id="size"
                  name="size"
                  layout="vertical"
                  placeholder="1"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Job Title"
                  id="title"
                  name="title"
                  layout="vertical"
                  placeholder="CEO"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Business email *"
                  id="email"
                  name="email"
                  layout="vertical"
                  placeholder="janedoe@example.sg"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Phone Number"
                  id="phone"
                  name="phone"
                  layout="vertical"
                  placeholder="+65 1234 1234"
                />
              </div>

              <div className="h-24">
                <Select
                  label="Country / Main Timezone"
                  id="country"
                  name="country"
                  layout="vertical"
                >
                  {countries.map(({ code, name }) => (
                    <Select.Option value={code}>{name}</Select.Option>
                  ))}
                </Select>
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

              <div className="flex flex-row-reverse w-full col-span-2 pt-4">
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
