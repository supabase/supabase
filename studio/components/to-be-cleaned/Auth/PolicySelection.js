import { Card, Typography } from '@supabase/ui'
import SVG from 'react-inlinesvg'

const PolicySelection = ({
  description = '',
  onViewTemplates = () => {},
  onViewEditor = () => {},
}) => {
  return (
    <div className="px-6">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex flex-col w-3/4">
          <Typography.Text>{description}</Typography.Text>
        </div>
      </div>
      <div className="my-8">
        <div className="flex items-center justify-center space-x-8">
          <div onClick={onViewTemplates}>
            <Card hoverable className="cursor-pointer py-4">
              <div className="flex items-center justify-between">
                <div className="w-1/2">
                  <Typography.Text>Get started quickly</Typography.Text>
                  <Typography.Title level={3}>Create a policy from a template</Typography.Title>
                </div>
                <SVG
                  src={'/img/policy-template.svg'}
                  alt={'policy-template'}
                  preProcessor={(code) =>
                    code.replace(/svg/, 'svg class="w-24 h-24 text-color-inherit opacity-75"')
                  }
                />
              </div>
            </Card>
          </div>
          <div onClick={onViewEditor}>
            <Card hoverable className="cursor-pointer py-4">
              <div className="flex items-center justify-between">
                <div className="w-1/2">
                  <Typography.Text>For full customization</Typography.Text>
                  <Typography.Title level={3}>Create a policy from scratch</Typography.Title>
                </div>
                <SVG
                  src={'/img/policy-new.svg'}
                  alt={'policy-new'}
                  preProcessor={(code) =>
                    code.replace(/svg/, 'svg class="w-24 h-24 text-color-inherit opacity-75"')
                  }
                />
              </div>
            </Card>
          </div>
        </div>
        <div className="mt-10 mx-auto text-center">
          <Typography.Text>
            Not sure what policies are? Check out our resources{' '}
            <a
              target="_blank"
              className="text-green-400"
              href="https://supabase.com/docs/guides/auth#policies"
            >
              here
            </a>
            .
          </Typography.Text>
        </div>
      </div>
    </div>
  )
}

export default PolicySelection
