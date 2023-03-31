# [WIP] Adding navigation for a new section

[Note] This isn't the best way for versioning in my opinion, but this is the current way to do it while we're migrating to Next.js

This folder holds the structure for the side navigation menu in the reference documentation pages. Each reference section (as well as their individual versions where applicable) have its own set of navigation.

The following are relevant to adding navigation for a new section:

- `getPageType()` from `lib/helpers`
- `menuItems` and `REFERENCES` from `components/Navigation/Navigation.constants`
- `NavMenu` from `components/Navigation/Navigation.types`

## Adding navigation for a section that doesn't require versioning

Example for standalone sections are the API and CLI reference pages. You'll just need to add a new file in this folder following the `NavMenu` interface (naming is arbitrary).

Thereafter, update `getPageType` to be able to get the page type based on the URL path - preferably follow the syntax of `reference/{section_name}`.

Finally, add the menu to `menuItems` under a new key - the key should be what you added to `getPageType` before.

## Adding navigation for a section that requires versioning

This is more applicable for client libraries (e.g supabase-js and supabase-dart). Versions will all sit within their own folder - if the folder doesn't exist yet, just create one. The navigation for each section will then be named as 'v1', 'v2', and so on.

Then, update `REFERENCES` accordingly.

Thereafter, update `getPageType` to be able to get the page type based on the URL path - preferably follow the syntax of `reference/{section_name}/{version}`. Typically the latest version available will not have the `/{version}` in it.

Finally, add the menu to `menuItems` under a new key - the key should be what you added to `getPageType` before.
