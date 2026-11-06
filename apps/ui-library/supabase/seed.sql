insert into "auth"."users"
  (
    "instance_id",
    "id",
    "aud",
    "role",
    "email",
    "encrypted_password",
    "email_confirmed_at",
    "invited_at",
    "recovery_token",
    "recovery_sent_at",
    "last_sign_in_at",
    "raw_app_meta_data",
    "raw_user_meta_data",
    "created_at",
    "updated_at"
  )
values
  (
    '00000000-0000-0000-0000-000000000000',
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'authenticated',
    'authenticated',
    'test@test.com',
    '$2a$10$rIvxpnRv5waKFZIQFpMJke079cHjJlqACLZXaONomkc4FaZ4Btlbe',
    '2024-02-03 23:38:34.499444+00',
    '2024-02-03 23:38:21.438042+00',
    'a73278d79e14c427ad5d21509fe88963d258377f77fe9e268d0a92ed',
    '2025-01-18 13:35:30.6347+00',
    '2025-02-09 14:27:57.653171+00',
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    '2024-02-03 23:38:21.431361+00',
    '2025-04-16 20:04:09.697799+00'
  );

insert into "public"."todos"
  ("id", "user_id", "task", "is_complete", "inserted_at")
values
  (1, '8999b3f3-6465-4135-9b4f-42c750b90ffb', 'Test task', true, '2024-03-20 14:23:45.000000+00'),
  (2, '8999b3f3-6465-4135-9b4f-42c750b90ffb', 'Do laundry', false, '2024-03-15 09:12:30.000000+00'),
  (
    3,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean bathroom',
    true,
    '2024-03-28 16:45:22.000000+00'
  ),
  (
    4,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Vacuum living room',
    false,
    '2024-03-10 11:30:15.000000+00'
  ),
  (
    5,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Mow the lawn',
    true,
    '2024-03-22 08:20:40.000000+00'
  ),
  (
    6,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Wash dishes',
    false,
    '2024-03-17 19:05:33.000000+00'
  ),
  (
    7,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean kitchen countertops',
    true,
    '2024-03-25 13:40:18.000000+00'
  ),
  (
    8,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Take out trash',
    false,
    '2024-03-12 07:55:27.000000+00'
  ),
  (
    9,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Organize closet',
    true,
    '2024-03-19 10:15:42.000000+00'
  ),
  (
    10,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean windows',
    false,
    '2024-03-27 15:30:55.000000+00'
  ),
  (
    11,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Water plants',
    true,
    '2024-03-14 12:45:10.000000+00'
  ),
  (
    12,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean refrigerator',
    false,
    '2024-03-23 17:20:35.000000+00'
  ),
  (
    13,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Dust furniture',
    true,
    '2024-03-16 14:10:25.000000+00'
  ),
  (
    14,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean oven',
    false,
    '2024-03-29 09:35:50.000000+00'
  ),
  (
    15,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Sweep floors',
    true,
    '2024-03-11 16:50:15.000000+00'
  ),
  (
    16,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean microwave',
    false,
    '2024-03-24 08:25:40.000000+00'
  ),
  (
    17,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Organize pantry',
    true,
    '2024-03-18 13:40:30.000000+00'
  ),
  (
    18,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean shower',
    false,
    '2024-03-26 11:15:45.000000+00'
  ),
  (
    19,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Wipe down baseboards',
    true,
    '2024-03-13 10:30:20.000000+00'
  ),
  (
    20,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean ceiling fans',
    false,
    '2024-03-21 15:45:55.000000+00'
  ),
  (
    21,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Organize garage',
    true,
    '2024-03-30 07:20:10.000000+00'
  ),
  (
    22,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean gutters',
    false,
    '2024-03-09 14:35:25.000000+00'
  ),
  (23, '8999b3f3-6465-4135-9b4f-42c750b90ffb', 'Wash car', true, '2024-03-31 12:50:40.000000+00'),
  (
    24,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean pet bedding',
    false,
    '2024-03-08 09:05:15.000000+00'
  ),
  (
    25,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Organize bookshelf',
    true,
    '2024-03-07 16:20:30.000000+00'
  ),
  (
    26,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean air filters',
    false,
    '2024-03-06 13:35:45.000000+00'
  ),
  (
    27,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean light fixtures',
    true,
    '2024-03-05 10:50:10.000000+00'
  ),
  (
    28,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Organize desk',
    false,
    '2024-03-04 08:05:25.000000+00'
  ),
  (
    29,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean patio furniture',
    true,
    '2024-03-03 15:20:40.000000+00'
  ),
  (
    30,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Clean door handles',
    false,
    '2024-03-02 12:35:55.000000+00'
  ),
  (
    31,
    '8999b3f3-6465-4135-9b4f-42c750b90ffb',
    'Organize medicine cabinet',
    true,
    '2024-03-01 09:50:20.000000+00'
  );
