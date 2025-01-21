import React, { FC } from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { CustomerLogo, CustomerQuote } from '../../pages/contact/sales'
import EnterpriseFormQuotes from '../EnterpriseFormQuotes'
import RequestADemoForm from '../Forms/RequestADemoForm'
import { useT } from '~/lib/intl'

interface Props {}

const UseCases: FC<Props> = (props) => {
  const t = useT()

  return (
    <SectionContainer className="text grid gap-8 lg:gap-12 md:grid-cols-2">
      <div className="lg:pb-8 md:h-full w-full flex flex-col justify-between gap-2">
        <div className="flex flex-col gap-2 md:max-w-md">
          <h1 className="h1 !m-0">{t('enterprise.demo.title')}</h1>
          <p className="md:text-lg text-foreground-lighter">{t('enterprise.demo.description')}</p>
        </div>
        <EnterpriseFormQuotes
          className="hidden md:flex"
          tabs={[
            {
              label: <CustomerLogo title="Goodtape" logo="/images/customers/logos/good-tape.png" />,
              panel: (
                <CustomerQuote
                  quote={t('enterprise.quotes.goodtape.quote')}
                  author={t('enterprise.quotes.goodtape.author')}
                />
              ),
            },
            {
              label: <CustomerLogo title="Xendit" logo="/images/customers/logos/xendit.png" />,
              panel: (
                <CustomerQuote
                  quote={t('enterprise.quotes.xendit.quote')}
                  author={t('enterprise.quotes.xendit.author')}
                />
              ),
            },
            {
              label: <CustomerLogo title="Chatbase" logo="/images/customers/logos/chatbase.png" />,
              panel: (
                <CustomerQuote
                  quote={t('enterprise.quotes.chatbase.quote')}
                  author={t('enterprise.quotes.chatbase.author')}
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
                quote={t('enterprise.quotes.goodtape.quote')}
                author={t('enterprise.quotes.goodtape.author.short')}
              />
            ),
          },
          {
            label: <CustomerLogo title="Xendit" logo="/images/customers/logos/xendit.png" />,
            panel: (
              <CustomerQuote
                quote={t('enterprise.quotes.xendit.quote')}
                author={t('enterprise.quotes.xendit.author.short')}
              />
            ),
          },
          {
            label: <CustomerLogo title="Chatbase" logo="/images/customers/logos/chatbase.png" />,
            panel: (
              <CustomerQuote
                quote={t('enterprise.quotes.chatbase.quote')}
                author={t('enterprise.quotes.chatbase.author')}
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
