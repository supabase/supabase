import { Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { useConfig } from '@/hooks/use-config'

function SonnerExpandConfig() {
  const [config, setConfig] = useConfig()

  return (
    <div className="px-5 py-5 border rounded-lg my-2 bg-surface-75">
      <form>
        <FormItemLayout
          name="sonnerExpand"
          id="sonnerExpand"
          isReactForm={false}
          label="Use expand prop"
          description="You will need to fire a few Sonner toasts first"
          layout="flex"
        >
          <Switch
            name="sonnerExpand"
            id="sonnerExpand"
            size="large"
            checked={config.sonnerExpand}
            onCheckedChange={(e) =>
              setConfig({
                ...config,
                sonnerExpand: e,
              })
            }
          />
        </FormItemLayout>
      </form>
    </div>
  )
}

export { SonnerExpandConfig }
