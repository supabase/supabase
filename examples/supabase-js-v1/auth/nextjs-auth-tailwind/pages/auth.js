import React from 'react'
import { AuthRedirect } from '../hooks/authUser'
import { supabase } from '../utils/initSupabase'
import { Auth, Card, Typography, Space } from '@supabase/ui'

import Head from '../components/Head'
import Header from '../components/Header'

const AuthPage = () => {
  AuthRedirect()

  return (
    <>
      <Head />
      <Header />
      <div className="authcontainer">
        <Card>
          <Space direction="vertical" size={8}>
            <div>
              <Typography.Title level={3}>Welcome</Typography.Title>
            </div>
            <Auth
              supabaseClient={supabase}
              providers={['google', 'github']}
              view={'sign_in'}
              socialLayout="horizontal"
              socialButtonSize="xlarge"
            />
          </Space>
        </Card>
      </div>
    </>
  )
}

export default AuthPage
