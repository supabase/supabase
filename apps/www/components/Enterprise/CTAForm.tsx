import React, { FC } from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { CustomerLogo, CustomerQuote } from '../../pages/contact/sales'
import EnterpriseFormQuotes from '../EnterpriseFormQuotes'
import RequestADemoForm from '../Forms/RequestADemoForm'

interface Props {}

const UseCases: FC<Props> = (props) => {
  return (
    <SectionContainer className="text grid gap-8 lg:gap-12 md:grid-cols-2">
      <div className="lg:pb-8 md:h-full w-full flex flex-col justify-between gap-2">
        <div className="flex flex-col gap-2 md:max-w-md">
          <h1 className="h1 !m-0">Request a demo</h1>
          <p className="md:text-lg text-foreground-lighter">
            We can take your requirements and show you how Supabase can help you achieve your goals.
          </p>
        </div>
        <EnterpriseFormQuotes
          className="hidden md:flex"
          tabs={[
            {
              label: <CustomerLogo title="Goodtape" logo="/images/customers/logos/good-tape.png" />,
              panel: (
                <CustomerQuote
                  quote="My biggest regret is not having gone with Supabase from the beginning."
                  author="Jakob Steinn, Co-founder & Tech Lead, Good Tape"
                />
              ),
            },
            {
              label: <CustomerLogo title="Xendit" logo="/images/customers/logos/xendit.png" />,
              panel: (
                <CustomerQuote
                  quote="The full solution was built and in production in less than one week."
                  author="Developer, Xendit"
                />
              ),
            },
            {
              label: <CustomerLogo title="Chatbase" logo="/images/customers/logos/chatbase.png" />,
              panel: (
                <CustomerQuote
                  quote="Supabase is great because it has everything. I don’t need a different solution for authentication, a different solution for database, or a different solution for storage."
                  author="Yasser Elsaid, Founder, Chatbase"
                  className="max-w-none"
                />
              ),
            },
          ]}
        />
      </div>
      <RequestADemoForm />
      <EnterpriseFormQuotes
        className="md:hidden mt-4"
        tabs={[
          {
            label: <CustomerLogo title="Goodtape" logo="/images/customers/logos/good-tape.png" />,
            panel: (
              <CustomerQuote
                quote="My biggest regret is not having gone with Supabase from the beginning."
                author="Jakob Steinn Co-founder & Tech Lead"
              />
            ),
          },
          {
            label: <CustomerLogo title="Xendit" logo="/images/customers/logos/xendit.png" />,
            panel: (
              <CustomerQuote
                quote="The full solution was built and in production in less than one week."
                author="Xendit developer"
              />
            ),
          },
          {
            label: <CustomerLogo title="Chatbase" logo="/images/customers/logos/chatbase.png" />,
            panel: (
              <CustomerQuote
                quote="Supabase is great because it has everything. I don’t need a different solution for authentication, a different solution for database, or a different solution for storage."
                author="Yasser Elsaid, Founder, Chatbase"
                className="max-w-none"
              />
            ),
          },
        ]}
      />
    </SectionContainer>
  )
}

export default UseCases
