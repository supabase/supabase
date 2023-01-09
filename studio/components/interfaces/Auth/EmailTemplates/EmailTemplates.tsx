import { Button, IconExternalLink, Tabs } from 'ui'
import { observer } from 'mobx-react-lite'

import { TEMPLATES_SCHEMAS } from 'stores/authConfig/schema'
import { FormHeader, FormPanel } from 'components/ui/Forms'
import TemplateEditor from './TemplateEditor'

const EmailTemplates = observer(() => {
  return (
    <div>
      <div className='flex justify-between items-center'>
        <FormHeader
          title="Email Templates"
          description="Customize the emails that will be sent out to your users."
        />
        <Button type="link" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
          <a
            target="_blank"
            href="https://supabase.com/docs/guides/auth/auth-email-templates"
          >
            Email Templates Documentation
          </a>
        </Button>
      </div>
      <FormPanel>
        <Tabs
          scrollable
          size="small"
          type="underlined"
          listClassNames="px-8 pt-4"
          defaultActiveId={TEMPLATES_SCHEMAS[0].title.trim().replace(/\s+/g, '-')}
        >
          {TEMPLATES_SCHEMAS.map((template) => {
            const panelId = template.title.trim().replace(/\s+/g, '-')
            return (
              <Tabs.Panel id={panelId} label={template.title} key={panelId}>
                <TemplateEditor key={template.title} template={template} />
              </Tabs.Panel>
            )
          })}
        </Tabs>
      </FormPanel>
    </div>
  )
})

export default EmailTemplates
