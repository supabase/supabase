import {
  Body,
  Column,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
  Button,
} from '@react-email/components'
import * as React from 'react'

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

export const TailwindDemoEmail = () => {
  console.log('here')

  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>You're now ready to make live transactions with Stripe!</Preview>
        <Body style={main} className="py-20">
          <Section className="m-[16px] max-w-[500px] mx-auto">
            <Section>
              <Row>
                <Text className="m-0 text-[16px] font-semibold leading-[24px] text-black">
                  Monthly email
                </Text>
                <Text className="m-0 mt-[8px] text-[24px] font-semibold leading-[32px] text-gray-900">
                  Supabase
                </Text>
              </Row>
            </Section>
            <Hr />
            <Section className="mt-12">
              <Row>
                <Text className="m-0 text-[16px] font-semibold leading-[24px] text-black">
                  Drinkware
                </Text>
                <Text className="m-0 mt-[8px] text-[24px] font-semibold leading-[32px] text-gray-900">
                  Ceramic Mugs
                </Text>
                <Text className="mt-[8px] text-[16px] leading-[24px] text-gray-500">
                  Storing vector embeddings in Postgres with pgvector is becoming increasingly
                  popular for AI applications, so we're building out a collection of tools to store,
                  index, and query embeddings at scale.
                </Text>
              </Row>
            </Section>
            <Section className="mt-[16px]">
              <Button className="w-content bg-gray-200 border font-mono uppercase text-gray-500 tracking-wide rounded-full text-[10px] py-0.5 px-1 mb-2">
                Supabase Vector
              </Button>
              <Text className="m-0 text-[16px] font-semibold leading-[24px] text-black mb-3">
                Supabase Vector: the open source Vector Toolkit for Postgres
              </Text>
              <Link href="#">
                <Img
                  alt="Mugs Collection"
                  className="rounded-[12px] object-cover"
                  height={180}
                  src="https://ci3.googleusercontent.com/meips/ADKq_NYd9_4TI6jfgzq8g70Wvk4UDEoEojlqpIzvOsDfO_Aqq6Ppwl5vXH8qH7CKdwTYvfhuR_mxRH6rtc9DbakNMWUpsPKC_M3ShhGcQV9nko3Ifu0n7OzQcZVq8dSkt6k=s0-d-e1-ft#https://hs-19953346.f.hubspotemail.net/hubfs/19953346/Untitled%20(4).png"
                  width="100%"
                />
              </Link>
              <Text className="mt-[8px] text-[16px] leading-[24px] text-gray-500 text-sm">
                Storing vector embeddings in Postgres with pgvector is becoming increasingly popular
                for AI applications, so we're building out a collection of tools to store, index,
                and query embeddings at scale.
              </Text>
            </Section>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  )
}

export default TailwindDemoEmail
