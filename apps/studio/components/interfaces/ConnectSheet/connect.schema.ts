import { FRAMEWORKS, MOBILES } from './Connect.constants'
import type { ConnectSchema, ConnectState, FieldOption, StepDefinition } from './Connect.types'

const frameworkOptions: FieldOption[] = [...FRAMEWORKS, ...MOBILES].map((framework) => ({
  value: framework.key,
  label: framework.label,
  icon: framework.icon,
}))

const modeOptions: FieldOption[] = [
  {
    value: 'framework',
    label: 'Framework',
    description: 'Use a client library',
  },
]

const getFrameworkVariantOptions = (state: ConnectState): FieldOption[] => {
  const allFrameworks = [...FRAMEWORKS, ...MOBILES]
  const selected = allFrameworks.find((framework) => framework.key === state.framework)
  if (!selected?.children?.length) return []
  if (selected.children.length <= 1) return []

  return selected.children.map((variant) => ({
    value: variant.key,
    label: variant.label,
    icon: variant.icon,
  }))
}

const getLibraryOptions = (state: ConnectState): FieldOption[] => {
  const allFrameworks = [...FRAMEWORKS, ...MOBILES]
  const selectedFramework = allFrameworks.find((framework) => framework.key === state.framework)
  if (!selectedFramework) return []

  if (selectedFramework.children?.length > 1 && state.frameworkVariant) {
    const variant = selectedFramework.children.find((child) => child.key === state.frameworkVariant)
    if (variant?.children?.length) {
      return variant.children.map((child) => ({
        value: child.key,
        label: child.label,
        icon: child.icon,
      }))
    }
  }

  if (selectedFramework.children?.length === 1) {
    const child = selectedFramework.children[0]
    if (child.children?.length) {
      return child.children.map((library) => ({
        value: library.key,
        label: library.label,
        icon: library.icon,
      }))
    }

    return [{ value: child.key, label: child.label, icon: child.icon }]
  }

  return []
}

// ============================================================================
// Step Definitions (reusable)
// All content paths use template syntax: {{stateKey}} is replaced with state values
// ============================================================================

const frameworkInstallStep: StepDefinition = {
  id: 'install',
  title: 'Install package',
  description: 'Run this command to install the required dependencies.',
  content: 'steps/install',
}

const frameworkConfigureStep: StepDefinition = {
  id: 'configure',
  title: 'Add files',
  description: 'Copy the following code into your project.',
  content: '{{framework}}/{{frameworkVariant}}/{{library}}',
}

const frameworkNextJsFilesStep: StepDefinition = {
  id: 'configure-nextjs',
  title: 'Add files',
  description:
    'Add env variables, create Supabase client helpers, and set up middleware to keep sessions refreshed.',
  content: '{{framework}}/{{frameworkVariant}}/{{library}}',
}

const frameworkReactFilesStep: StepDefinition = {
  id: 'configure-react',
  title: 'Add files',
  description: 'Add env variables, create a Supabase client, and use it in your app to query data.',
  content: '{{framework}}/{{frameworkVariant}}/{{library}}',
}

const frameworkShadcnStep: StepDefinition = {
  id: 'shadcn-add',
  title: 'Add Supabase UI components',
  description: 'Run this command to install the Supabase shadcn components.',
  content: 'steps/shadcn/command',
}

const frameworkShadcnExploreStep: StepDefinition = {
  id: 'shadcn-explore',
  title: 'Check out more UI components',
  description: 'Add auth, realtime and storage functionality to your project',
  content: 'steps/shadcn/explore',
}

const skillsInstallStep: StepDefinition = {
  id: 'install-skills',
  title: 'Install Agent Skills (Optional)',
  description:
    'Agent Skills give AI coding tools ready-made instructions, scripts, and resources for working with Supabase more accurately and efficiently.',
  content: 'steps/skills-install',
}

// ============================================================================
// Main Schema
// ============================================================================

export const connectSchema: ConnectSchema = {
  // -------------------------------------------------------------------------
  // Field Definitions
  // -------------------------------------------------------------------------
  fields: {
    mode: {
      id: 'mode',
      type: 'radio-list',
      label: 'Mode',
      options: modeOptions,
      defaultValue: 'framework',
    },
    // Framework fields
    framework: {
      id: 'framework',
      type: 'select',
      label: 'Framework',
      options: frameworkOptions,
      defaultValue: 'nextjs',
      dependsOn: { mode: ['framework'] },
    },
    frameworkVariant: {
      id: 'frameworkVariant',
      type: 'select',
      label: 'Variant',
      options: getFrameworkVariantOptions,
      defaultValue: 'vite',
      dependsOn: { mode: ['framework'], framework: ['nextjs', 'react'] }, // Only show for frameworks with multiple variants
    },
    library: {
      id: 'library',
      type: 'select',
      label: 'Library',
      options: getLibraryOptions,
      defaultValue: 'supabasejs',
      dependsOn: { mode: ['framework'] },
    },
    frameworkUi: {
      id: 'frameworkUi',
      type: 'switch',
      label: 'Shadcn',
      description: 'Install components via the Supabase shadcn registry.',
      defaultValue: false,
      dependsOn: { mode: ['framework'], framework: ['nextjs', 'react'] },
    },
  },

  // -------------------------------------------------------------------------
  // Steps - Conditional based on mode and nested selections
  // -------------------------------------------------------------------------
  steps: {
    // Keys are field IDs; each field maps state values to step trees.
    mode: {
      framework: {
        framework: {
          nextjs: {
            frameworkUi: {
              true: [
                frameworkInstallStep,
                frameworkShadcnStep,
                frameworkShadcnExploreStep,
                skillsInstallStep,
              ],
              DEFAULT: [frameworkInstallStep, frameworkNextJsFilesStep, skillsInstallStep],
            },
          },
          react: {
            frameworkUi: {
              true: [
                frameworkInstallStep,
                frameworkShadcnStep,
                frameworkShadcnExploreStep,
                skillsInstallStep,
              ],
              DEFAULT: [frameworkInstallStep, frameworkReactFilesStep, skillsInstallStep],
            },
          },
          DEFAULT: [frameworkInstallStep, frameworkConfigureStep, skillsInstallStep],
        },
      },
    },
  },
}
