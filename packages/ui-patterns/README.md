# Supabase UI Patterns

This package should be used for components which are built using NPM libraries (`react-markdown`, `reactflow` for example),
which make no sense to be included in all apps. It should also be used for components which are constructed using various
components from the `ui` package.

This package does not have a barrel file - each component has to be imported from its index
(`ui-patterns/PrivacySettings`, for example). This is intentional so that adding a new component which is used only in
1 or 2 apps doesn't burden the rest of the apps.
