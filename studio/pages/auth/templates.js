import AuthLayout from '../../components/layouts/AuthLayout'
import { Card, Button, Badge, IconSearch, Input, Divider, Typography } from '@supabase/ui'

export default function Home() {
  let templates = [
    {
      title: 'Confirm Signup',
      subject: 'Confirm Your Signup',
      body: '<h2>Confirm your signup</h2>\n<p>Follow this link to confirm your user:</p>\n<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>',
    },
    {
      title: 'Reset password',
      subject: 'Reset Your Password',
      body: '<h2>Reset Password</h2>\n<p>Follow this link to reset the password for your user:</p>\n<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>',
    },
    {
      title: 'Your Magic Link',
      subject: 'Your Magic Link',
      body: '<h2>Your Magic Link</h2>\n<p>Follow this link to login to your account:</p>\n<p><a href="{{ .ConfirmationURL }}">Log in</a></p>',
    },
    {
      title: 'Invite user',
      subject: 'You have been invited',
      body: '<h2>You have been invited</h2>\n<p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>\n<p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>',
    },
  ]
  return (
    <AuthLayout title="Users">
      <div>
        {templates.map((tamplate) => {
          return <TemplateCard tamplate={tamplate} />
        })}
      </div>
    </AuthLayout>
  )
}

const TemplateCard = ({ tamplate: template }) => {
  return (
    <div className="border-b my-8 mx-8">
      <div className="flex">
        <div className="flex-auto">
          <Card
            title={<Typography.Title level={4}>{template?.title}</Typography.Title>}
            titleExtra={
              <div className="flex space-x-2">
                <div>
                  <Button type="outline">Cancel</Button>
                </div>
                <div>
                  <Button>Save</Button>
                </div>
              </div>
            }
          >
            <Card.Meta
              title={
                <div>
                  <div className="h-16 flex flex-wrap content-between">
                    <div className="mr-10">Subject</div>
                    <div className="flex-1">
                      <Input defaultValue={template?.subject} />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <div className="mr-14">Body</div>
                    <div className="flex-1">
                      <Input.TextArea value={template?.body} />
                    </div>
                  </div>
                </div>
              }
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
