import useSWR from 'swr'
import { Notification } from '@supabase/shared-types/out/notifications'

import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export const useNotifications = () => {
  const { data, error, mutate } = useSWR<Notification[]>(`${API_URL}/notifications`, get)

  const anyError = (data as any)?.error || error !== undefined
  const refresh = () => mutate()

  const mockNotifications = [
    {
      id: '2baae200-48fa-4c87-854e-cf7916399f33',
      inserted_at: '2022-11-08T05:06:25.487659+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'new',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "todo-list-live" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
        changelog_link: 'http://joshen.me',
      },
      meta: { actions_available: [{ action_type: 'project.upgrade' }] },
    },
    {
      id: '1e493360-469b-4bdb-a4e8-9fc4dce930d8',
      inserted_at: '2022-11-08T05:06:25.481716+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'new',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "postgres-email" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
        changelog_link: 'http://joshen.me',
      },
      meta: { actions_available: [{ action_type: 'project.upgrade' }] },
    },
    {
      id: '9509d9b7-a63d-45d0-8f06-cb8f7c7c7755',
      inserted_at: '2022-11-08T05:06:24.680516+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'new',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "Realtime Multiplayer Demo (multiplayer.dev)" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
      },
      meta: { actions_available: [] },
    },
    {
      id: '0f8a3bad-cc81-4300-adc8-dc6c63800e51',
      inserted_at: '2022-11-07T07:27:58.493636+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'seen',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "stripe_sequin_export" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
      },
      meta: { actions_available: [] },
    },
    {
      id: 'bb0b13f8-2e4d-4fa4-a001-d119bde7ea8b',
      inserted_at: '2022-11-07T07:27:57.773127+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'seen',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "Slack Clone PROD" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
      },
      meta: { actions_available: [] },
    },
    {
      id: 'c095de3c-b3d5-4c6a-a8bd-b68f90c66aaa',
      inserted_at: '2022-11-07T07:27:57.535813+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'seen',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "joshen (safe to delete)" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
      },
      meta: { actions_available: [] },
    },
    {
      id: '41002dd7-5fcb-4a4e-86c3-20c9cac71b70',
      inserted_at: '2022-11-07T07:27:57.535813+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'seen',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "Simple Multiplayer Game" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
      },
      meta: { actions_available: [] },
    },
    {
      id: '6eb306d7-f935-4c29-bdbf-9dadf75a87d9',
      inserted_at: '2022-11-07T07:27:57.00973+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'seen',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "meme.town" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
      },
      meta: { actions_available: [] },
    },
    {
      id: '69baca0f-56d3-46a9-aee5-f8345a449473',
      inserted_at: '2022-11-07T07:27:56.913767+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'seen',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "supabase-eu-central-1" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
      },
      meta: { actions_available: [] },
    },
    {
      id: 'a3da0f85-5f53-4380-8d2e-c6d2631bd322',
      inserted_at: '2022-11-07T07:27:56.844569+00:00',
      project_id: 2,
      notification_name: 'project.informational',
      notification_status: 'seen',
      data: {
        name: 'project.informational',
        message:
          'To enhance privacy, Postgres for project "supabase-ap-southeast-1" has been updated to not log statement executions. To change this behavior, refer to the "Postgres" section on https://supabase.com/docs/guides/platform/logs',
      },
      meta: { actions_available: [] },
    },
  ]

  return {
    // notifications: anyError ? undefined : data,
    notifications: mockNotifications,
    isLoading: !anyError && !data,
    isError: !!anyError,
    refresh,
  }
}
