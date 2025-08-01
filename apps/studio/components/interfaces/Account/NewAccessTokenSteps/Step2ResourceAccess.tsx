
import { type Control } from 'react-hook-form'

import {
  FormField_Shadcn_,
  FormControl_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ACCESS_TOKEN_ORGS, ACCESS_TOKEN_PROJECTS } from '../AccessToken.constants'

interface Step2ResourceAccessProps {
  control: Control<any>
  resourceAccess: string
}

const Step2ResourceAccess = ({
  control,
  resourceAccess,
}: Step2ResourceAccessProps) => {
  return (
    <>
      <FormField_Shadcn_
        key="resourceAccess"
        name="resourceAccess"
        control={control}
        render={({ field }) => (
          <FormItemLayout name="resourceAccess" label="Resource access">
            <FormControl_Shadcn_>
              <RadioGroupStacked
                id="resourceAccess"
                value={field.value}
                onValueChange={field.onChange}
              >
                <RadioGroupStackedItem
                  value="all-orgs"
                  label="Everything"
                  showIndicator={false}
                >
                  <p className="text-foreground-light text-left">
                    Access to all projects across all organizations you have access to.
                  </p>
                </RadioGroupStackedItem>
                <RadioGroupStackedItem
                  value="selected-orgs"
                  label="Only selected organizations"
                  showIndicator={false}
                >
                  <p className="text-foreground-light text-left">
                    Access only to the organizations you have specified.
                  </p>
                </RadioGroupStackedItem>
                <RadioGroupStackedItem
                  value="selected-projects"
                  label="Only selected projects"
                  showIndicator={false}
                >
                  <p className="text-foreground-light text-left">
                    Access only to the projects you have specified.
                  </p>
                </RadioGroupStackedItem>
              </RadioGroupStacked>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />

      {resourceAccess === 'selected-orgs' && (
        <FormField_Shadcn_
          key="selectedOrganizations"
          name="selectedOrganizations"
          control={control}
          render={({ field }) => (
            <FormItemLayout name="selectedOrganizations" label="Select organizations">
              <FormControl_Shadcn_ className="overflow-visible">
                <MultiSelector values={field.value || []} onValuesChange={field.onChange}>
                  <MultiSelectorTrigger
                    deletableBadge
                    showIcon={false}
                    mode="inline-combobox"
                    label="Select organizations"
                    badgeLimit="wrap"
                  />
                  <MultiSelectorContent className="z-50">
                    <MultiSelectorList>
                      {ACCESS_TOKEN_ORGS.map((org) => (
                        <MultiSelectorItem key={org} value={org}>
                          {org}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
      )}

      {resourceAccess === 'selected-projects' && (
        <FormField_Shadcn_
          key="selectedProjects"
          name="selectedProjects"
          control={control}
          render={({ field }) => (
            <FormItemLayout name="selectedProjects" label="Select projects">
              <FormControl_Shadcn_ className="overflow-visible">
                <MultiSelector values={field.value || []} onValuesChange={field.onChange}>
                  <MultiSelectorTrigger
                    deletableBadge
                    showIcon={false}
                    mode="inline-combobox"
                    label="Select projects"
                    badgeLimit="wrap"
                  />
                  <MultiSelectorContent className="z-50">
                    <MultiSelectorList>
                      {ACCESS_TOKEN_PROJECTS.map((project) => (
                        <MultiSelectorItem key={project} value={project}>
                          {project}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
      )}


    </>
  )
}

export default Step2ResourceAccess 