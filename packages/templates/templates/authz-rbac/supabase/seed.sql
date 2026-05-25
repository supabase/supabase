insert into public.role_permissions (role, permission)
values
  ('admin', 'items.read'),
  ('admin', 'items.write'),
  ('admin', 'items.delete'),
  ('admin', 'admin.access'),
  ('moderator', 'items.read'),
  ('moderator', 'items.write'),
  ('moderator', 'items.delete'),
  ('member', 'items.read'),
  ('member', 'items.write')
on conflict do nothing;
