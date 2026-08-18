# PrivateLink preview extract

Prototype-only. Delete this folder when splitting Track B into real PRs. Do not ship the presenter or mocks.

Enable: `?privatelinkPreview=1` on Project Settings → Integrations. Optional: `?privatelinkPreviewScenario=<id>`.

Grep: `usePrivateLinkPreview`, `usePreviewNavManagedBy`, `PrivateLinkPreview`, `privatelinkPreview`, `replayPrivateLinkAddedToast`, `PRIVATE_LINK_PREVIEW_`.

## Delete this folder

`apps/studio/components/interfaces/Settings/Integrations/AWSPrivateLink/preview/`

Includes the floating presenter (`PrivateLinkPreviewPanel`), scenario mocks, Vercel card overrides, and this file.

## Session keys to drop

- `supabase.privatelink-preview`
- `supabase.privatelink-preview-scenario`

## Production leaks (revert these)

| File                                                                                               | What to remove                                                                                                                                      |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/studio/components/layouts/DefaultLayout.tsx`                                                 | `PrivateLinkPreviewPanel` import and render                                                                                                         |
| `apps/studio/components/layouts/AppLayout/OrganizationDropdown.tsx`                                | `usePreviewNavManagedBy`. Restore `<PartnerIcon organization={selectedOrganization} />`                                                             |
| `apps/studio/components/layouts/AppLayout/ProjectDropdown.tsx`                                     | `usePreviewNavManagedBy`. Restore the live `selectedProjectManagedBy` ternary                                                                       |
| `apps/studio/components/layouts/AppLayout/OrganizationDropdown.test.tsx`                           | Preview hook mock                                                                                                                                   |
| `apps/studio/components/layouts/AppLayout/ProjectDropdown.test.tsx`                                | Preview hook mock                                                                                                                                   |
| `apps/studio/components/interfaces/Settings/Integrations/VercelIntegration/VercelSection.tsx`      | Preview import, `vercelCard` overlay, `showPrivateLinkFromVercel` footer, `<PrivateLinkPreviewVercelOverride />`. Keep the real Install empty state |
| `apps/studio/components/interfaces/Settings/Integrations/AWSPrivateLink/AWSPrivateLinkSection.tsx` | Preview import, mock `accounts`, `skipUpgradeWall`                                                                                                  |
| `apps/studio/components/interfaces/Settings/Integrations/AWSPrivateLink/AWSPrivateLinkForm.tsx`    | Preview import, `prefillAwsAccountId`, preview-enabled submit that skips POST and replays the toast                                                 |
| `apps/studio/components/interfaces/ConnectSheet/content/steps/direct-connection/content.tsx`       | `PRIVATE_LINK_PREVIEW_HOSTNAME` and `showPrivateHostname` block                                                                                     |
| `apps/studio/components/interfaces/Settings/Database/NetworkRestrictions/NetworkRestrictions.tsx`  | `showRestrictPublicAccess` block                                                                                                                    |

## What the mocks cover

- Empty PrivateLink list, AWS-direct connected / waiting / expired, mixed Vercel + AWS-direct rows
- Vercel-initiated partner cue on a PrivateLink row (`partner: 'vercel'`)
- Install empty with a PrivateLink pointer footer when the row was created from Vercel
- Marketplace Vercel card (`acme-app`) with and without a PrivateLink pointer footer
- Optional destination IAM role on the add sheet (UI only, not POSTed)
- Nav `managed_by` fake for Marketplace and Marketplace plus PrivateLink only (org + project switcher)
- Private hostname in Connect, restrict-public-access copy on Network Restrictions
- Post-add toast: static “Connection added”. Accept copy lives on the list admonition

## Keep (not preview)

Copy and layout that should survive extract: static Vercel / GitHub / PrivateLink section subtitles, GitHub empty-state copy, PrivateLink row title/status/delete, list admonition, optional IAM role field once the API exists, Vercel partner mark on real partner rows.
