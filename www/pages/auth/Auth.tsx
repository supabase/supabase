import { useRouter } from 'next/router'

import {
  Button,
  Auth,
  Card,
  Space,
  Tabs,
  Typography,
  IconCode,
  IconZoomIn,
  IconCopy,
  IconKey,
  IconBriefcase,
  IconEye,
  IconX,
} from '@supabase/ui'
import { createClient } from '@supabase/supabase-js'
import DefaultLayout from '~/components/Layouts/Default'

import AuthStyles from './Auth.module.css'

import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ProductHeader from '~/components/Sections/ProductHeader'
import FeatureSection from '~/components/Sections/FeatureSection'
import SectionContainer from '~/components/Layouts/SectionContainer'

import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import FeatureColumn from '~/components/FeatureColumn'
import FloatingIcons from '~/components/FloatingIcons'

import ApiExamples from 'data/products/database/api-examples'
import AuthSqlRulesExamples from 'data/products/auth/auth-sql-rules-examples'

function AuthPage() {
  // base path for images
  const { basePath } = useRouter()

  // supabase auth widget project details
  const supabase = createClient(
    'https://rsnibhkhsbfnncjmwnkj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
  )

  return (
    <DefaultLayout>
      <ProductHeader
        h1={[
          <span>
            Unlimited users
            <br /> with social providers
          </span>,
        ]}
        subheader={[
          'An open source scalable object store, capable of holding any file and file size you like.',
          'With custom policies and permissions that are familair, easy to implement and unlimited scalable storage.',
        ]}
      />

      <SectionContainer>
        <FeatureSection />
      </SectionContainer>

      <SectionContainer className="-mb-48">
        <APISection
          title="Simple and convenient APIs"
          content={ApiExamples}
          footer={[
            <div className="grid grid-cols-12 gap-16 mt-8">
              <div className="col-span-4">
                <FeatureColumn
                  icon={<IconBriefcase />}
                  title="Enterprise logins"
                  text="Type definitions for both server side and client side"
                />
              </div>
              <div className="col-span-4">
                <FeatureColumn
                  icon={<IconEye />}
                  title="Social login scopes"
                  text="Request additonal user data permissions when using social logins"
                />
              </div>
            </div>,
          ]}
        />
      </SectionContainer>

      <div className="relative">
        <div className="section--masked">
          <div className="section--bg-masked">
            <div className="section--bg border-t border-b border-gray-100 dark:border-gray-600"></div>
          </div>
          <div className="section-container pt-12 pb-0">
            <FloatingIcons />
            <div className="overflow-x-hidden">
              <SectionContainer className="mb-0 pb-8">
                <GithubExamples />
              </SectionContainer>
            </div>
          </div>
        </div>
      </div>

      <SectionContainer>
        <div className="grid grid-cols-12 lg:gap-16">
          <div className="col-span-12 lg:col-span-5 mb-8">
            <Typography.Title level={2}>No middleware user permission</Typography.Title>
            <p className="text-lg">
              Restrict user access with row level security, even without prior knowledge of SQL.
              Control who can create, edit and delete specific rows in your database.
            </p>
            <p>
              Set up user profiles in your app using methods such as auth.user() so you can spend
              more time building an app, rather than user profile forms.
            </p>
            <Button size="small" className="mt-4">
              Expore documentation
            </Button>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <SplitCodeBlockCarousel content={AuthSqlRulesExamples} />
          </div>
        </div>
      </SectionContainer>

      <div className="container mx-auto px-8 sm:px-16 xl:px-20 relative py-32">
        <div className="grid grid-cols-12 lg:gap-16">
          <div className="col-span-12 lg:col-span-6">
            <div
              className={`relative bg-white dark:bg-gray-800 py-2 pb-16 border dark:border-gray-600 ${AuthStyles['auth-container']}`}
            >
              <div className="w-full h-full left-0 top-2">
                <Tabs
                  size="medium"
                  defaultActiveId="panel-1"
                  type="underlined"
                  tabBarStyle={{ padding: '0 16px' }}
                  addOnAfter={[
                    <Space>
                      <Button type="outline" icon={<IconCopy />}>
                        Copy code
                      </Button>
                    </Space>,
                  ]}
                >
                  <Tabs.Panel label="Preview" id="panel-1" icon={<IconZoomIn />}>
                    <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                      <Card>
                        <Space size={8} direction="vertical">
                          <div>
                            <Space size={3} direction="vertical">
                              <img src="https://app.supabase.io/img/supabase-dark.svg" width="96" />
                              <Typography.Title level={3}>{'Acme Company'}</Typography.Title>
                            </Space>
                          </div>
                          <Auth
                            providers={['facebook', 'google', 'github', 'bitbucket', 'gitlab']}
                            socialButtonSize={'medium'}
                            socialLayout={'horizontal'}
                            supabaseClient={supabase}
                            socialColors={false}
                          />
                        </Space>
                      </Card>
                    </div>
                  </Tabs.Panel>
                  <Tabs.Panel label="Code" icon={<IconCode />} id="panel-2">
                    <div className="h-full">
                      <CodeBlock
                        hideCopy
                        children={`// Auth example
                      
import React, { useState } from 'react'
import { Auth } from './'
import { createClient } from '@supabase/supabase-js'
// @ts-ignore
import { Typography, Button, Space } from '../../index'

export default function app() { 

    const supabase = createClient(
        'https://YOUR-PROJECT-ID.supabase.co',
        'YOUR-PUBLIC-ANON-KEY'
    )

    return (
        <Auth.UserContextProvider {...args}>
            <Container {...args}>
                <Auth {...args} />
            </Container>
        </Auth.UserContextProvider>
    )
}
`}
                        lang="js"
                      />
                    </div>
                  </Tabs.Panel>
                </Tabs>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-8 mt-8 lg:mt-0">
            <Space className="mb-4">
              <div className="w-8 h-8 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900  flex justify-center items-center">
                <IconKey size="small" strokeWidth={1.5} />
              </div>
              <Typography.Text type="secondary">
                <IconX />
              </Typography.Text>
              <img className="w-8" src={`${basePath}/images/product/auth/react-icon.svg`} />
            </Space>

            <Typography.Title level={2} className="mb-4">
              ReactJS Auth Widget
            </Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                Bring authentication to your ReactJS app without coding a single form.
              </p>
              <p className="text-base">
                We provide a ReactJS component that handles all the usual needs for logging in,
                signing up, magic link and forgot password forms.
              </p>
            </Typography.Text>
            <Button>Explore documentation</Button>

            <div className="grid grid-cols-12 gap-16 mt-8">
              <div className="col-span-4">
                <FeatureColumn
                  icon={<IconBriefcase />}
                  title="Enterprise logins"
                  text="Type definitions for both server side and client side"
                />
              </div>
              <div className="col-span-4">
                <FeatureColumn
                  icon={<IconEye />}
                  title="Social login scopes"
                  text="Request additonal user data permissions when using social logins"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

export default AuthPage
