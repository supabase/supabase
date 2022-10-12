import * as Yup from 'yup'
import Link from 'next/link'
import { useState } from 'react'
import { Button, Form, Input } from '@supabase/ui'

import supabase from '~/lib/supabase'
import CTABanner from 'components/CTABanner/index'
import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'

const SOC2 = () => {
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<string>()
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)

  const INITIAL_VALUES = { email: '' }

  const FormSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
  })

  const handleFormSubmit = async (values: typeof INITIAL_VALUES, { resetForm }: any) => {
    console.log('handleFormSubmit ran', values)
    try {
      setError(undefined)
      const { error } = await supabase
        .from('soc2_downloads')
        .insert([{ contact_email: values.email, document: 'soc2' }])

      if (error) throw error

      resetForm()
      setFormSubmitted(true)
    } catch (error: any) {
      setError(error.message)
    }
  }
  return (
    <Layout>
      <SectionContainer>
        <div className="mx-auto grid max-w-2xl grid-cols-12 rounded-lg">
          <div className="col-span-12 flex items-center lg:col-span-12">
            <div className="prose flex flex-col space-y-8 p-16">
              <h1 className="text-center text-5xl">SOC2</h1>
              <p>
                As a database company, being SOC2 compliant is important when handling sensitive
                customer data. Supabase is currently SOC2 Type 1 compliant and we're also working on
                getting certified for SOC2 Type 2 and HIPAA next.
              </p>

              <p>
                You can request for our latest SOC 2 document through our{' '}
                <Link href="https://security.supabase.com/">security portal</Link>, or by submitting
                your email here.
              </p>

              {formSubmitted ? (
                <p className="text-brand-900">
                  Thank you for your submission! A member from the Supabase team will reach out to
                  you shortly!
                </p>
              ) : (
                <Form
                  initialValues={INITIAL_VALUES}
                  validationSchema={FormSchema}
                  onSubmit={handleFormSubmit}
                >
                  {({ isSubmitting }: any) => (
                    <>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        name="email"
                        id="email"
                        required
                        descriptionText="We only keep a record of your email so we can update you when the document has been updated."
                        placeholder="Your email address"
                        actions={
                          <Button
                            htmlType="submit"
                            type="default"
                            loading={isSubmitting}
                            className="mr-1"
                          >
                            Request SOC2 document
                          </Button>
                        }
                      />
                      {error && <p>{error}</p>}
                    </>
                  )}
                </Form>
              )}
            </div>
          </div>
        </div>
      </SectionContainer>
      <CTABanner />
    </Layout>
  )
}
export default SOC2
