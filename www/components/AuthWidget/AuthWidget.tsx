import { useState } from 'react'
import { createClient, Provider } from '@supabase/supabase-js'

import DefaultLayout from '~/components/Layouts/Default'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import {
  Button,
  Auth,
  Card,
  Checkbox,
  Divider,
  Radio,
  Select,
  Space,
  Tabs,
  Typography,
  Input,
  Toggle,
  IconCode,
  IconZoomIn,
  IconCopy,
  IconColumns,
} from '@supabase/ui'

import AuthStyles from './Auth.module.css'

function AuthPage() {
  const supabase = createClient(
    'https://rsnibhkhsbfnncjmwnkj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
  )

  type SizeProps = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  type LayoutProps = 'horizontal' | 'vertical'

  const [companyName, setCompanyName] = useState('Acme Company')
  const [widgetSize, setWidgetSize] = useState<SizeProps>('tiny')
  const [socialLogins, setSocialLogins] = useState(true)
  const [socialLoginLayout, setSocialLoginLayout] = useState<LayoutProps>('horizontal')
  const [socialColors, setSocialColors] = useState(false)

  const socials: Provider[] = ['facebook', 'google', 'bitbucket', 'github', 'gitlab']

  const formSize = 'small'
  const formLayout = 'vertical'

  return (
    <DefaultLayout>
      <div className="container mx-auto px-8 sm:px-16 xl:px-20 relative py-32">
        <div className="grid grid-cols-12">
          <div className="col-span-8">
            <Typography.Title level={2} className="mb-4">
              ReactJS Auth Widget
            </Typography.Title>
            <Typography.Text>
              An API built from the groud up just for Storage.With powerful library clients coming
              soon that allow for asset optimasation and image transformation
            </Typography.Text>
          </div>
          <div className="col-span-8">
            <div
              className={`relative bg-white dark:bg-gray-800 py-2 pb-16 border-t border-l border-b dark:border-gray-600 ${AuthStyles['auth-container']}`}
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
                      <Button type="outline" icon={<IconColumns />}>
                        Customise
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
                              <Typography.Title level={3}>{companyName}</Typography.Title>
                            </Space>
                          </div>
                          <Auth
                            providers={socialLogins ? socials : []}
                            socialButtonSize={widgetSize}
                            socialLayout={socialLoginLayout}
                            supabaseClient={supabase}
                            socialColors={socialColors}
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

          <div className="col-span-4">
            <div className="bg-white dark:bg-gray-800 border rounded-l-none dark:border-gray-600 rounded h-full">
              <div className={`p-8`}>
                <Space size={12} direction="vertical">
                  <div>
                    <Typography.Title level={3}>Customise your login form</Typography.Title>
                    <Typography.Text>
                      Our ReactJS Auth form will help you get going even quicker{' '}
                    </Typography.Text>
                  </div>
                  <Divider light />
                  <Input
                    size={formSize}
                    layout={formLayout}
                    label="Name of app"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  {/* @ts-ignore */}
                  <Space size={8} direction="vertical">
                    <Card>
                      <Space size={8} direction="vertical">
                        <Checkbox
                          size={formSize}
                          label="Show social logins"
                          description=" "
                          checked={socialLogins}
                          onChange={() => setSocialLogins(!socialLogins)}
                        />
                        {socialLogins && (
                          <>
                            <Divider light />
                            {/* @ts-ignore */}
                            <Radio.Group
                              size={formSize}
                              type="cards"
                              label="Social button layout"
                              layout={formLayout}
                              name="layout-group"
                              value={socialLoginLayout}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                // @ts-ignore
                                setSocialLoginLayout(e.target.value)
                              }
                            >
                              <Radio
                                name="layout-group"
                                key={'horizontal'}
                                label={'horizontal'}
                                value={'horizontal'}
                              />
                              <Radio
                                name="layout-group"
                                key={'vertical'}
                                label={'vertical'}
                                value={'vertical'}
                              />
                            </Radio.Group>
                            <Toggle
                              size={formSize}
                              layout="vertical"
                              align="right"
                              labelOptional="Use brand colors on buttons"
                              label="Social colors"
                              //   descriptionText="Show the brand colors of the social logins in the buttons"
                              checked={socialColors}
                              onChange={() => setSocialColors(!socialColors)}
                            />
                          </>
                        )}
                      </Space>
                    </Card>
                  </Space>
                  <Radio.Group
                    size={formSize}
                    type="cards"
                    label="Form size"
                    labelOptional="This is an optional label"
                    descriptionText="This controls the button sizes and form input sizes"
                    layout={formLayout}
                    name="size-group"
                    value={widgetSize}
                    /* @ts-ignore */
                    onChange={(e) => setWidgetSize(e.target.value)}
                  >
                    <Radio name="size-group" key={1} label={'tiny'} value={'tiny'} />
                    <Radio name="size-group" key={2} label={'small'} value={'small'} />
                    <Radio name="size-group" key={3} label={'medium'} value={'medium'} />
                    <Radio name="size-group" key={3} label={'large'} value={'large'} />
                    <Radio name="size-group" key={3} label={'xlarge'} value={'xlarge'} />
                  </Radio.Group>
                </Space>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

export default AuthPage
